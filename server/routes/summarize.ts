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
import type { ModelMessage } from '../types.js';

export const summarizeRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const EntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  theme: z.string(),
  content: z.string(),
});

const SummarizeRequestSchema = z.object({
  userId: z.string().optional(),
  entryId: z.string().optional(),
  threadId: z.string().optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
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

  try {
    // 2. Assemble journal context (optionally anchored to a specific entry)
    const jouspaceContext = await assembleContext('user-1', 'summarize', {
      anchorEntryId: parsed.data.entryId,
      entries: parsed.data.entries,
    });

    // 3. Build the summarize system prompt + a single user turn
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'summarize');
    const anchorMessages: ModelMessage[] = [
      { role: 'user', content: 'Summarize my recent journal entries.' },
    ];
    const modelMessages = buildMessages(systemPrompt, anchorMessages);

    // 4. Stream the summary to the client
    const gateway = createModelGateway();
    initSSE(res);
    await streamToClient(req, res, gateway.streamCompletion(modelMessages));
  } catch (err) {
    next(err);
  }
});
