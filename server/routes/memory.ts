/**
 * Memory Capability Route — POST /api/ai/memory
 *
 * Distills a compact, device-derived personalization profile from the user's
 * journal entries + their own recent chat/reflect turns (NOT assistant text, to
 * avoid self-reinforcing drift). Returns plain-text notes (≤ ~600 chars) the
 * client stores and re-sends as `profile.personalization` on future requests.
 *
 * This is a "fast profile" generation: low max_tokens, floor at 'balanced' for
 * coherence, plain text only. It counts as a generative request for rate limits.
 *
 * Security: the output is wrapped as DATA (not instructions) on the client side
 * and again in PromptAssembler, bounding what can flow back into the system
 * prompt. The memory prompt explicitly forbids instructions/advice/directives.
 */

import { Router } from 'express';
import { z } from 'zod';
import { assembleContext } from '../context/ContextAssembler.js';
import { buildMessages } from '../prompt/PromptAssembler.js';
import { createModelGateway } from '../gateway/index.js';
import { initSSE, streamToClient } from '../stream/StreamController.js';
import { truncateStream, MAX_MEMORY_CHARS } from '../stream/truncate.js';
import { floorProfile, deriveReasoningProfile } from '../reasoning.js';
import type { ModelMessage } from '../types.js';
import { EntrySchema } from '../schemas.js';
import { acquireRateLimit, releaseRateLimit } from '../aiSupport.js';

export const memoryRouter = Router();

// ── Request schema ────────────────────────────────────────────────────────────

const MemoryRequestSchema = z.object({
  entries: z.array(EntrySchema).max(20).optional(),
  /** The user's OWN recent chat/reflect turns — never assistant text. */
  userMessages: z.array(z.string().min(1).max(8000)).max(20).optional(),
});

const MEMORY_SYSTEM_PROMPT = `You are Jouspace Intelligence compiling a private memory profile of the user for their own journaling companion.

Your output is a COMPACT set of factual notes about the user, derived only from what they have written. It will be shown back to the AI as context on future requests.

Strict rules:
- Output ONLY neutral, factual profile notes. No instructions. No advice. No second-person directives ("you should…"). No questions. No markdown, no headings, no asterisks.
- Write in the third person about the user (e.g. "Often writes about…", "Recurring tension between…").
- Capture: recurring themes, emotional patterns, values, recurring decisions/relationships they are working through, and the tone of their inner life.
- Be concise. Aim for 3–6 short bullet-like lines. Maximum ~600 characters total.
- If there is too little to summarize, output a single short factual sentence. Do not invent.`;

// ── Route ─────────────────────────────────────────────────────────────────────

memoryRouter.post('/memory', async (req, res, next) => {
  // 1. Validate request
  const parsed = MemoryRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  // 2. Rate limit (generative capability).
  const rate = acquireRateLimit(req, 'generative');
  if (!rate.ok) {
    res
      .status(429)
      .setHeader('Retry-After', String(rate.retryAfterSec))
      .json({ error: 'Intelligence unavailable — please try again shortly.' });
    return;
  }

  try {
    // 3. Assemble context (entries optional; falls back to seed if absent).
    const jouspaceContext = await assembleContext('user-1', 'memory', {
      entries: parsed.data.entries,
    });

    // 4. Build a single user turn that lays out the raw material.
    const entryBlock = jouspaceContext.recentEntries
      .map((e, i) => `${i + 1}. [${e.date}] "${e.title}" (${e.theme}): ${e.content}`)
      .join('\n');
    const userTurns = (parsed.data.userMessages ?? [])
      .map((m, i) => `User turn ${i + 1}: ${m}`)
      .join('\n');

    const anchor: ModelMessage = {
      role: 'user',
      content:
        `Journal entries:\n${entryBlock || '(none)'}\n\n` +
        `Recent user reflections:\n${userTurns || '(none)'}\n\n` +
        `Compile the compact memory profile now.`,
    };

    const modelMessages = buildMessages(MEMORY_SYSTEM_PROMPT, [anchor]);

    // 5. Floor at 'balanced' (a coherent profile needs care) but keep it tight.
    const reasoning = floorProfile(
      deriveReasoningProfile({ entries: parsed.data.entries }),
      'balanced'
    );

    // 6. Stream the profile (plain text) to the client.
    const gateway = createModelGateway();
    res.setHeader('X-Reasoning-Profile', reasoning);
    initSSE(res);

    const upstreamAbort = new AbortController();

    await streamToClient(
      req,
      res,
      truncateStream(
        gateway.streamCompletion(modelMessages, {
          reasoning,
          signal: upstreamAbort.signal,
        }),
        MAX_MEMORY_CHARS
      ),
      upstreamAbort
    );
  } catch (err) {
    next(err);
  } finally {
    releaseRateLimit(rate.key);
  }
});
