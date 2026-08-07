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
import type { ModelMessage } from '../types.js';

export const reflectRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
});

const EntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  theme: z.string(),
  content: z.string(),
});

const ReflectRequestSchema = z.object({
  insight: z.string().min(1).max(1000),
  userThought: z.string().max(4000).optional(),
  history: z.array(HistoryMessageSchema).max(20).optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
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

  const { insight, userThought, history = [], entries } = parsed.data;

  try {
    // 2. Assemble journal context with the insight as anchor
    const jouspaceContext = await assembleContext('user-1', 'reflect', {
      anchorInsight: insight,
      entries,
    });

    // 3. Build the reflection-specific system prompt
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'reflect');

    // 4. Construct message history
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

    // 5. Get gateway and start SSE stream
    const gateway = createModelGateway();
    initSSE(res);

    // 6. Stream response tokens to the client
    await streamToClient(req, res, gateway.streamCompletion(modelMessages));
  } catch (err) {
    next(err);
  }
});
