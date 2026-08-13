/**
 * Summarize Capability Route — POST /api/ai/summarize
 *
 * Generates a brief private summary of the user's recent journal entries,
 * streamed as SSE. This powers "Writing Summary" surfaces (e.g. Profile).
 *
 * Request body:
 *   { userId?: string, entryId?: string, threadId?: string }
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

export const summarizeRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const SummarizeRequestSchema = z.object({
  userId: z.string().optional(),
  entryId: z.string().optional(),
  threadId: z.string().optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
  /** Device-derived personalization (treated as data, not instructions) */
  profile: ProfileSchema.optional(),
});

// ── Route ─────────────────────────────────────────────────────────────────────

summarizeRouter.post('/summarize', async (req, res, next) => {
  // 1. Validate request
  const parsed = SummarizeRequestSchema.safeParse(req.body);
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
    // 3. Assemble journal context (optionally anchored to a specific entry)
    const jouspaceContext = await assembleContext('user-1', 'summarize', {
      anchorEntryId: parsed.data.entryId,
      entries: parsed.data.entries,
      profile: parsed.data.profile,
    });

    // 4. Build the summarize system prompt + a single user turn
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'summarize');
    const anchorMessages: ModelMessage[] = [
      { role: 'user', content: 'Summarize my recent journal entries.' },
    ];
    const modelMessages = buildMessages(systemPrompt, anchorMessages);

    // 5. Derive adaptive reasoning profile — floored at 'balanced' (precise).
    const reasoning = floorProfile(
      deriveReasoningProfile({ entries: parsed.data.entries }),
      'balanced'
    );

    // 6. Stream the summary to the client (header must be set before flush)
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
