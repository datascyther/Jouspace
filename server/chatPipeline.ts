/**
 * chatPipeline.ts — Shared conversational completion pipeline
 *
 * Both the Chat route (POST /api/ai/chat) and the Voice Chat route
 * (POST /api/ai/voice-chat) stream a Jouspace Intelligence reply through the
 * exact same steps: domain pre-filter → rate limit → adaptive reasoning profile
 * → journal context assembly → system prompt → model gateway → SSE stream.
 *
 * The only difference: voice chat transcribes the user's recording first,
 * appends the transcript as the newest user message, and emits a `transcript`
 * event before the model tokens so the client can show what was heard.
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { assembleContext } from './context/ContextAssembler.js';
import { buildSystemPrompt, buildMessages } from './prompt/PromptAssembler.js';
import { createModelGateway } from './gateway/index.js';
import { initSSE, streamToClient } from './stream/StreamController.js';
import { deriveReasoningProfile } from './reasoning.js';
import { EntrySchema, ProfileSchema, MessageSchema } from './schemas.js';
import { acquireRateLimit, releaseRateLimit, streamRefusal } from './aiSupport.js';
import { anyOffDomain } from './guard.js';

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  context: z
    .object({ entryId: z.string().optional() })
    .optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
  /** Device-derived personalization (treated as data, not instructions) */
  profile: ProfileSchema.optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export interface ChatPipelineOptions {
  /** Conversation history, including the newest user message. */
  messages: ChatRequest['messages'];
  context?: ChatRequest['context'];
  entries?: ChatRequest['entries'];
  profile?: ChatRequest['profile'];
  /** Runs after SSE headers are sent, before the first model token — used by
   *  voice chat to emit the transcript event. */
  beforeTokens?: (res: Response) => void;
}

/**
 * Stream a conversational completion. Owns everything downstream of request
 * validation: domain pre-filter, rate limiting, context/prompt assembly, and
 * the SSE stream. Writes either the SSE stream (200) or a JSON error.
 */
export async function runChatPipeline(
  req: Request,
  res: Response,
  options: ChatPipelineOptions
): Promise<void> {
  const { messages, context: reqContext, entries, profile } = options;

  // Cheap domain pre-filter: refuse clearly off-domain intent without spending
  // a model call. Lenient — only fires on unambiguous signals.
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (anyOffDomain(lastUser?.content)) {
    streamRefusal(res);
    return;
  }

  // Rate limit (token bucket + concurrency) — only counts after a valid,
  // on-domain request so malformed/off-domain traffic doesn't burn quota.
  const rate = acquireRateLimit(req, 'conversational');
  if (!rate.ok) {
    res
      .status(429)
      .setHeader('Retry-After', String(rate.retryAfterSec))
      .json({ error: 'Intelligence unavailable — please try again shortly.' });
    return;
  }

  try {
    // Derive the adaptive reasoning profile from the raw request BEFORE
    // assembling context: the profile must reflect message length + chat
    // history, not the passive entry dump (the client always sends up to
    // 20 entries, and a large journal must not inflate a short "hi" to
    // 'deep'). The fast lane also trims how many entries reach the model.
    const userText = lastUser?.content ?? '';
    const contextChars = messages
      .filter((m) => m !== lastUser)
      .reduce((sum, m) => sum + m.content.length, 0);
    const reasoning = deriveReasoningProfile({ userText, entries, contextChars });

    // Assemble journal context from the client's real entries. Fast-lane
    // requests get only the 2 most recent entries as light context; all other
    // profiles keep the default 5.
    const jouspaceContext = await assembleContext('user-1', 'chat', {
      anchorEntryId: reqContext?.entryId,
      entries,
      maxEntries: reasoning === 'fast' ? 2 : 5,
      profile,
    });

    // Build the system prompt and full message array
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'chat');
    const modelMessages = buildMessages(systemPrompt, messages);

    // Get gateway and start SSE stream (header must be set before flush)
    const gateway = createModelGateway();
    res.setHeader('X-Reasoning-Profile', reasoning);
    initSSE(res);

    // Voice chat emits the transcript as the first event.
    options.beforeTokens?.(res);

    // Upstream abort controller: cancelled on client disconnect or the
    // StreamController ceiling so the NVIDIA call is released promptly.
    const upstreamAbort = new AbortController();

    // Stream response tokens to the client
    await streamToClient(
      req,
      res,
      gateway.streamCompletion(modelMessages, {
        reasoning,
        signal: upstreamAbort.signal,
      }),
      upstreamAbort
    );
  } finally {
    releaseRateLimit(rate.key);
  }
}
