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

export const chatRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const MessageSchema = z.object({
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

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  context: z
    .object({ entryId: z.string().optional() })
    .optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
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

  const { messages, context: reqContext, entries } = parsed.data;

  try {
    // 2. Assemble journal context from the client's real entries
    const jouspaceContext = await assembleContext('user-1', 'chat', {
      anchorEntryId: reqContext?.entryId,
      entries,
    });

    // 3. Build the system prompt and full message array
    const systemPrompt = buildSystemPrompt(jouspaceContext, 'chat');
    const modelMessages = buildMessages(systemPrompt, messages);

    // 4. Get gateway and start SSE stream
    const gateway = createModelGateway();
    initSSE(res);

    // 5. Stream response tokens to the client
    await streamToClient(req, res, gateway.streamCompletion(modelMessages));
  } catch (err) {
    next(err);
  }
});
