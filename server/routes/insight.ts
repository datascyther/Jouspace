/**
 * Insight Capability Route — POST /api/ai/insight
 *
 * Generates a single observational insight sentence from the user's recent
 * journal entries, streamed as SSE. This powers the "Jouspace noticed…"
 * cards on the Home screen.
 *
 * Request body:
 *   { userId?: string, entryIds?: string[] }
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
import { EntrySchema, ProfileSchema } from '../schemas.js';
import { acquireRateLimit, releaseRateLimit } from '../aiSupport.js';

export const insightRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const InsightRequestSchema = z.object({
  userId: z.string().optional(),
  entryIds: z.array(z.string()).max(20).optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
  /** Device-derived personalization (treated as data, not instructions) */
  profile: ProfileSchema.optional(),
});

// ── Route ─────────────────────────────────────────────────────────────────────

insightRouter.post('/insight', async (req, res, next) => {
  // 1. Validate request
  const parsed = InsightRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  // 2. Rate limit (token bucket + concurrency). Generative capability.
  const rate = acquireRateLimit(req, 'generative');
  if (!rate.ok) {
    res
      .status(429)
      .setHeader('Retry-After', String(rate.retryAfterSec))
      .json({ error: 'Intelligence unavailable — please try again shortly.' });
    return;
  }

  try {
    // 3. Assemble journal context from the client's real entries
    const jouspaceContext = await assembleContext('user-1', 'insight', {
      entries: parsed.data.entries,
      profile: parsed.data.profile,
    });

    // 4. Build the insight system prompt + a single user turn to anchor generation
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'insight');
    const anchorMessages: ModelMessage[] = [
      { role: 'user', content: 'What is the one thing worth noticing in my recent writing?' },
    ];
    const modelMessages = buildMessages(systemPrompt, anchorMessages);

    // 5. Derive adaptive reasoning profile — floored at 'balanced' (precise).
    const reasoning = floorProfile(
      deriveReasoningProfile({ entries: parsed.data.entries }),
      'balanced'
    );

    // 6. Stream the insight to the client (header must be set before flush)
    const gateway = createModelGateway();
    res.setHeader('X-Reasoning-Profile', reasoning);
    initSSE(res);

    // Upstream abort controller: cancelled on client disconnect or the
    // StreamController ceiling so the NVIDIA call is released promptly.
    const upstreamAbort = new AbortController();

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
