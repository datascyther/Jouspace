/**
 * Chat Capability Route — POST /api/ai/chat
 *
 * Accepts a conversation history and streams a Jouspace Intelligence response.
 * The full pipeline: ContextAssembler → PromptAssembler → ModelGateway → StreamController
 *
 * Request body:
 *   { messages: ModelMessage[], context?: { entryId?: string } }
 *
 * Response:
 *   text/event-stream  (SSE)
 *   data: {"text":"..."}\n\n   — token chunks
 *   data: [DONE]\n\n           — stream end
 */

import { Router } from 'express';
import { z } from 'zod';
import { assembleContext } from '../context/ContextAssembler.js';
import { buildSystemPrompt, buildMessages } from '../prompt/PromptAssembler.js';
import { createModelGateway } from '../gateway/index.js';
import { initSSE, streamToClient } from '../stream/StreamController.js';
import { deriveReasoningProfile } from '../reasoning.js';
import { EntrySchema, ProfileSchema, MessageSchema } from '../schemas.js';
import { acquireRateLimit, releaseRateLimit, streamRefusal } from '../aiSupport.js';
import { anyOffDomain } from '../guard.js';

export const chatRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  context: z
    .object({ entryId: z.string().optional() })
    .optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
  /** Device-derived personalization (treated as data, not instructions) */
  profile: ProfileSchema.optional(),
});

// ── Route ─────────────────────────────────────────────────────────────────────

chatRouter.post('/chat', async (req, res, next) => {
  // 1. Validate request
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { messages, context: reqContext, entries, profile } = parsed.data;

  // 2. Cheap domain pre-filter: refuse clearly off-domain intent without
  //    spending a model call. Lenient — only fires on unambiguous signals.
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (anyOffDomain(lastUser?.content)) {
    streamRefusal(res);
    return;
  }

  // 3. Rate limit (token bucket + concurrency) — only counts after a valid,
  //    on-domain request so malformed/off-domain traffic doesn't burn quota.
  const rate = acquireRateLimit(req, 'conversational');
  if (!rate.ok) {
    res
      .status(429)
      .setHeader('Retry-After', String(rate.retryAfterSec))
      .json({ error: 'Intelligence unavailable — please try again shortly.' });
    return;
  }

  try {
    // 4. Derive the adaptive reasoning profile from the raw request BEFORE
    //    assembling context: the profile must reflect message length + chat
    //    history, not the passive entry dump (the client always sends up to
    //    20 entries, and a large journal must not inflate a short "hi" to
    //    'deep'). The fast lane also trims how many entries reach the model.
    const userText = lastUser?.content ?? '';
    const contextChars = messages
      .filter((m) => m !== lastUser)
      .reduce((sum, m) => sum + m.content.length, 0);
    const reasoning = deriveReasoningProfile({ userText, entries, contextChars });

    // 5. Assemble journal context from the client's real entries. Fast-lane
    //    requests get only the 2 most recent entries as light context; all
    //    other profiles keep the default 5.
    const jouspaceContext = await assembleContext('user-1', 'chat', {
      anchorEntryId: reqContext?.entryId,
      entries,
      maxEntries: reasoning === 'fast' ? 2 : 5,
      profile,
    });

    // 6. Build the system prompt and full message array
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'chat');
    const modelMessages = buildMessages(systemPrompt, messages);

    // 7. Get gateway and start SSE stream (header must be set before flush)
    const gateway = createModelGateway();
    res.setHeader('X-Reasoning-Profile', reasoning);
    initSSE(res);

    // Upstream abort controller: cancelled on client disconnect or the
    // StreamController ceiling so the NVIDIA call is released promptly.
    const upstreamAbort = new AbortController();

    // 8. Stream response tokens to the client
    await streamToClient(
      req,
      res,
      gateway.streamCompletion(modelMessages, {
        reasoning,
        signal: upstreamAbort.signal,
      }),
      upstreamAbort
    );
  } catch (err) {
    next(err);
  } finally {
    releaseRateLimit(rate.key);
  }
});
