/**
 * Chat Capability Route — POST /api/ai/chat
 *
 * Accepts a conversation history and streams a Jouspace Intelligence response.
 * The full pipeline lives in chatPipeline.ts: ContextAssembler → PromptAssembler
 * → ModelGateway → StreamController.
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
import { ChatRequestSchema, runChatPipeline } from '../chatPipeline.js';

export const chatRouter = Router();

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

  try {
    await runChatPipeline(req, res, parsed.data);
  } catch (err) {
    next(err);
  }
});
