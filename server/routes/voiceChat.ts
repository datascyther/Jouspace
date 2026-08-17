/**
 * Voice Chat Capability Route — POST /api/ai/voice-chat
 *
 * Accepts a recorded voice clip (base64 WAV) plus optional chat history,
 * transcribes it server-side via the NVIDIA ASR gateway, appends the transcript
 * as the newest user message, then streams a Jouspace Intelligence reply through
 * the exact same pipeline as /api/ai/chat (see chatPipeline.ts).
 *
 * Request body:
 *   {
 *     audio: "data:audio/wav;base64,....",   // mono 16-bit PCM WAV
 *     durationMs?: number,
 *     messages: ModelMessage[],               // prior conversation (may be [])
 *     context?: { entryId?: string },
 *     entries?: Entry[],
 *     profile?: Profile,
 *   }
 *
 * Response (SSE):
 *   data: {"transcript":"..."}\n\n   — what was heard (first event)
 *   data: {"text":"..."}\n\n         — token chunks
 *   data: [DONE]\n\n                 — stream end
 */

import { Router } from 'express';
import { z } from 'zod';
import { createModelGateway } from '../gateway/index.js';
import { runChatPipeline } from '../chatPipeline.js';
import { EntrySchema, ProfileSchema, MessageSchema } from '../schemas.js';
import { acquireRateLimit, releaseRateLimit } from '../aiSupport.js';

export const voiceChatRouter = Router();

// Cap the clip so a runaway recording can't blow the JSON body limit. The
// client auto-stops at 45s (~1.4MB WAV → ~1.9MB base64), this is a hard backstop.
const MAX_AUDIO_CHARS = 2.5 * 1024 * 1024;

const VoiceChatRequestSchema = z.object({
  /** Base64 data URL of a WAV recording (mono 16-bit PCM). */
  audio: z.string().min(1).max(MAX_AUDIO_CHARS),
  /** Length of the clip in ms (client UI only). */
  durationMs: z.number().int().positive().max(60_000).optional(),
  /** Prior conversation — voice chat may start from an empty history. */
  messages: z.array(MessageSchema).max(50).optional(),
  context: z
    .object({ entryId: z.string().optional() })
    .optional(),
  /** Local-first: the client's real journal entries used for AI context */
  entries: z.array(EntrySchema).max(20).optional(),
  /** Device-derived personalization (treated as data, not instructions) */
  profile: ProfileSchema.optional(),
});

/** Strip the `data:audio/wav;base64,` prefix and decode to raw bytes. */
function decodeAudioDataUrl(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Buffer.from(base64, 'base64');
}

voiceChatRouter.post('/voice-chat', async (req, res, next) => {
  // 1. Validate request
  const parsed = VoiceChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { audio, messages = [], context, entries, profile } = parsed.data;

  // 2. Rate limit BEFORE spending ASR + LLM credits. Transcription is the
  //    costliest step, so voice messages charge the tighter generative bucket.
  const rate = acquireRateLimit(req, 'generative');
  if (!rate.ok) {
    res
      .status(429)
      .setHeader('Retry-After', String(rate.retryAfterSec))
      .json({ error: 'Intelligence unavailable — please try again shortly.' });
    return;
  }

  // 3. Transcribe the clip. The generative slot is released as soon as the
  //    transcript exists, then the LLM reply re-enters the normal chat budget
  //    — so a single voice request never holds two concurrency slots at once.
  let transcript: string;
  try {
    const buffer = decodeAudioDataUrl(audio);
    const gateway = createModelGateway();
    transcript = await gateway.transcribeAudio(buffer);
  } finally {
    releaseRateLimit(rate.key);
  }

  if (!transcript.trim()) {
    res.status(422).json({ error: 'No speech detected in the recording.' });
    return;
  }

  // 4. Run the exact same chat pipeline, with the transcript as the newest
  //    user message and a leading `transcript` event so the client can show
  //    what was heard while the reply streams in.
  try {
    await runChatPipeline(req, res, {
      messages: [...messages, { role: 'user', content: transcript }],
      context,
      entries,
      profile,
      beforeTokens: (r) => {
        r.write(`data: ${JSON.stringify({ transcript })}\n\n`);
      },
    });
  } catch (err) {
    next(err);
  }
});
