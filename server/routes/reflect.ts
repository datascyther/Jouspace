/**
 * Reflect Capability Route — POST /api/ai/reflect
 *
 * Accepts an insight anchor and optional conversation history,
 * and streams a focused Jouspace Intelligence reflection response.
 * The full pipeline: ContextAssembler → PromptAssembler → ModelGateway → StreamController
 *
 * Request body:
 *   {
 *     insight: string,         — The AI insight being reflected on
 *     userThought?: string,    — Optional follow-up from the user
 *     history?: ModelMessage[] — Prior turns in this reflection session
 *   }
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
import { deriveReasoningProfile, floorProfile } from '../reasoning.js';
import type { ModelMessage } from '../types.js';
import { EntrySchema, ProfileSchema, MessageSchema } from '../schemas.js';
import { acquireRateLimit, releaseRateLimit, streamRefusal } from '../aiSupport.js';
import { anyOffDomain } from '../guard.js';

export const reflectRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const HistoryMessageSchema = MessageSchema;

const ReflectRequestSchema = z.object({
  insight: z.string().min(1).max(1000),
  userThought: z.string().max(4000).optional(),
  history: z.array(HistoryMessageSchema).max(20).optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
  /** Device-derived personalization (treated as data, not instructions) */
  profile: ProfileSchema.optional(),
});

// ── Route ─────────────────────────────────────────────────────────────────────

reflectRouter.post('/reflect', async (req, res, next) => {
  // 1. Validate request
  const parsed = ReflectRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { insight, userThought, history = [], entries, profile } = parsed.data;

  // 2. Cheap domain pre-filter on the reflection anchor + the user's thought.
  if (anyOffDomain(insight, userThought)) {
    streamRefusal(res);
    return;
  }

  // 3. Rate limit (token bucket + concurrency).
  const rate = acquireRateLimit(req, 'conversational');
  if (!rate.ok) {
    res
      .status(429)
      .setHeader('Retry-After', String(rate.retryAfterSec))
      .json({ error: 'Intelligence unavailable — please try again shortly.' });
    return;
  }

  try {
    // 4. Assemble journal context with the insight as anchor
    const jouspaceContext = await assembleContext('user-1', 'reflect', {
      anchorInsight: insight,
      entries,
      profile,
    });

    // 5. Build the reflection-specific system prompt
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'reflect');

    // 6. Construct message history
    //    If there's no prior history, open with the insight as context,
    //    then the user's current thought (or a default opener).
    const conversationMessages: ModelMessage[] = history.length > 0
      ? history
      : [
          {
            role: 'user',
            content: userThought
              ? `I want to reflect on this: "${insight}"\n\nMy thought: ${userThought}`
              : `I want to reflect on this: "${insight}"`,
          },
        ];

    const modelMessages = buildMessages(systemPrompt, conversationMessages);

    // 7. Derive adaptive reasoning profile — floored at 'balanced' because a
    //    reflection is a substantive generation, never a trivial chat.
    const reasoning = floorProfile(
      deriveReasoningProfile({ userText: userThought ?? '', entries }),
      'balanced'
    );

    // 8. Get gateway and start SSE stream (header must be set before flush)
    const gateway = createModelGateway();
    res.setHeader('X-Reasoning-Profile', reasoning);
    initSSE(res);

    // Upstream abort controller: cancelled on client disconnect or the
    // StreamController ceiling so the NVIDIA call is released promptly.
    const upstreamAbort = new AbortController();

    // 9. Stream response tokens to the client
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
