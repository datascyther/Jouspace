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
import type { ModelMessage } from '../types.js';

export const insightRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const EntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  theme: z.string(),
  content: z.string(),
});

const InsightRequestSchema = z.object({
  userId: z.string().optional(),
  entryIds: z.array(z.string()).max(20).optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
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

  try {
    // 2. Assemble journal context from the client's real entries
    const jouspaceContext = await assembleContext('user-1', 'insight', {
      entries: parsed.data.entries,
    });

    // 3. Build the insight system prompt + a single user turn to anchor generation
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'insight');
    const anchorMessages: ModelMessage[] = [
      { role: 'user', content: 'What is the one thing worth noticing in my recent writing?' },
    ];
    const modelMessages = buildMessages(systemPrompt, anchorMessages);

    // 4. Stream the insight to the client
    const gateway = createModelGateway();
    initSSE(res);
    await streamToClient(req, res, gateway.streamCompletion(modelMessages));
  } catch (err) {
    next(err);
  }
});
