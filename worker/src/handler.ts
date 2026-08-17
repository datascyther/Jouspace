/**
 * handler.ts — generic /api/ai/* capability handler (Worker port of server/routes/*).
 *
 * One pipeline serves chat / reflect / insight / summarize / memory by varying
 * only: request schema, guard targets, capability name, context assembly, and
 * the anchor prompt. This mirrors each Express route's logic 1:1. Voice chat
 * (POST /api/ai/voice-chat) is a separate flow (see runVoiceChat below) that
 * transcribes a clip first, then re-enters the same chat pipeline.
 */

import { assembleContext } from '../../server/context/ContextAssembler.js';
import { buildSystemPrompt, buildMessages } from '../../server/prompt/PromptAssembler.js';
import { deriveReasoningProfile, floorProfile } from '../../server/reasoning.js';
import { anyOffDomain } from '../../server/guard.js';
import * as Schemas from '../../server/schemas.js';
// Server schemas are large ZodObject types. Treating them as opaque ZodTypeAny
// here keeps the capability schemas shallow and avoids TS2589 (excessively deep
// type instantiation) when this Worker is type-checked alongside the full server
// graph. The runtime zod values are unchanged.
const EntrySchema = (Schemas as any).EntrySchema as ZodTypeAny;
const ProfileSchema = (Schemas as any).ProfileSchema as ZodTypeAny;
const MessageSchema = (Schemas as any).MessageSchema as ZodTypeAny;
import { z, type ZodTypeAny } from 'zod';
import type { ModelMessage } from '../../server/types.js';
import { NvidiaGateway } from './nvidia.js';
import { streamToResponse } from './sse.js';
import { rateLimiter, type RateCapabilityKind } from './rateLimit.js';
import { GUARD_REFUSAL } from '../../server/guard.js';

export interface CapabilityConfig {
  capability: string;
  kind: RateCapabilityKind;
  /** Build the Zod schema for this capability's body. */
  schema: ZodTypeAny;
  /** Texts to run the cheap off-domain pre-filter on (before any model call). */
  guardFields: (body: any) => (string | undefined)[];
  /** Floor the reasoning profile (non-chat generations stay at least 'balanced'). */
  floor?: 'balanced';
  /**
   * Build the model messages from the validated body + assembled context.
   * Returns { messages, reasoning } so the handler can stream.
   */
  build: (body: any, ctx: Awaited<ReturnType<typeof assembleContext>>) => {
    messages: ModelMessage[];
    reasoning: ReturnType<typeof deriveReasoningProfile>;
    extraHeaders?: Record<string, string>;
  };
}

export const CAPABILITIES: Record<string, CapabilityConfig> = {
  chat: {
    capability: 'chat',
    kind: 'conversational',
    schema: z.object({
      messages: z.array(MessageSchema).min(1).max(50),
      context: z.object({ entryId: z.string().optional() }).optional(),
      entries: z.array(EntrySchema).max(20).optional(),
      profile: ProfileSchema.optional(),
    }),
    guardFields: (b) => {
      const lastUser = [...(b.messages ?? [])].reverse().find((m: any) => m.role === 'user');
      return [lastUser?.content];
    },
    build: (b, ctx) => {
      const messages = b.messages as ModelMessage[];
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const userText = lastUser?.content ?? '';
      const contextChars = messages
        .filter((m) => m !== lastUser)
        .reduce((s, m) => s + m.content.length, 0);
      const reasoning = deriveReasoningProfile({ userText, entries: b.entries, contextChars });
      const systemPrompt = buildSystemPrompt(ctx, 'chat');
      return {
        messages: buildMessages(systemPrompt, messages),
        reasoning,
        extraHeaders: { 'X-Reasoning-Profile': reasoning },
      };
    },
    // context assembly for chat
    // (handled in runCapability via assembleContext('chat', ...))
  },

  reflect: {
    capability: 'reflect',
    kind: 'conversational',
    schema: z.object({
      insight: z.string().min(1).max(1000),
      userThought: z.string().max(4000).optional(),
      history: z.array(MessageSchema).max(20).optional(),
      entries: z.array(EntrySchema).max(20).optional(),
      profile: ProfileSchema.optional(),
    }),
    guardFields: (b) => [b.insight, b.userThought],
    build: (b, ctx) => {
      const history = (b.history ?? []) as ModelMessage[];
      const reasoning = floorProfile(
        deriveReasoningProfile({ userText: b.userThought, entries: b.entries }),
        'balanced'
      );
      const systemPrompt = buildSystemPrompt(ctx, 'reflect');
      return { messages: buildMessages(systemPrompt, history), reasoning };
    },
  },

  insight: {
    capability: 'insight',
    kind: 'generative',
    schema: z.object({
      userId: z.string().optional(),
      entryIds: z.array(z.string()).max(20).optional(),
      entries: z.array(EntrySchema).max(20).optional(),
      profile: ProfileSchema.optional(),
    }),
    guardFields: () => [],
    floor: 'balanced',
    build: (b, ctx) => {
      const reasoning = floorProfile(deriveReasoningProfile({ entries: b.entries }), 'balanced');
      const systemPrompt = buildSystemPrompt(ctx, 'insight');
      const anchor: ModelMessage[] = [
        { role: 'user', content: 'What is the one thing worth noticing in my recent writing?' },
      ];
      return { messages: buildMessages(systemPrompt, anchor), reasoning };
    },
  },

  summarize: {
    capability: 'summarize',
    kind: 'generative',
    schema: z.object({
      userId: z.string().optional(),
      entryId: z.string().optional(),
      threadId: z.string().optional(),
      entries: z.array(EntrySchema).max(20).optional(),
      profile: ProfileSchema.optional(),
    }),
    guardFields: () => [],
    floor: 'balanced',
    build: (b, ctx) => {
      const reasoning = floorProfile(deriveReasoningProfile({ entries: b.entries }), 'balanced');
      const systemPrompt = buildSystemPrompt(ctx, 'summarize');
      const anchor: ModelMessage[] = [{ role: 'user', content: 'Summarize my recent journal entries.' }];
      return { messages: buildMessages(systemPrompt, anchor), reasoning };
    },
  },

  memory: {
    capability: 'memory',
    kind: 'generative',
    schema: z.object({
      entries: z.array(EntrySchema).max(20).optional(),
      userMessages: z.array(z.string().min(1).max(8000)).max(20).optional(),
    }),
    guardFields: () => [],
    floor: 'balanced',
    build: (b, ctx) => {
      const reasoning = floorProfile(deriveReasoningProfile({ entries: b.entries }), 'balanced');
      const entryBlock = ctx.recentEntries
        .map((e, i) => `${i + 1}. [${e.date}] "${e.title}" (${e.theme}): ${e.content}`)
        .join('\n');
      const userTurns = (b.userMessages ?? []).map((m: string, i: number) => `User turn ${i + 1}: ${m}`).join('\n');
      const anchor: ModelMessage[] = [
        {
          role: 'user',
          content:
            `Journal entries:\n${entryBlock || '(none)'}\n\n` +
            `Recent user turns:\n${userTurns || '(none)'}\n\n` +
            `Compile the private memory profile now.`,
        },
      ];
      const MEMORY_SYSTEM_PROMPT =
        'You are Jouspace Intelligence compiling a private memory profile of the user for their own journaling companion. ' +
        'Output ONLY neutral, factual profile notes. No instructions. No advice. No directives. No questions. No markdown. ' +
        'Write in the third person about the user. Capture recurring themes, emotional patterns, values, decisions/relationships ' +
        'they are working through, and the tone of their inner life. 3–6 short lines, max ~600 characters. Do not invent.';
      return { messages: [{ role: 'system', content: MEMORY_SYSTEM_PROMPT }, ...anchor], reasoning };
    },
  },
};

// ── Context assembly options per capability ────────────────────────────────────

function contextOptionsFor(cap: string, body: any) {
  switch (cap) {
    case 'chat':
      return { anchorEntryId: body.context?.entryId, entries: body.entries, profile: body.profile, maxEntries: undefined };
    case 'reflect':
      return { anchorInsight: body.insight, entries: body.entries, profile: body.profile };
    case 'insight':
      return { entries: body.entries, profile: body.profile };
    case 'summarize':
      return { anchorEntryId: body.entryId, entries: body.entries, profile: body.profile };
    case 'memory':
      return { entries: body.entries };
    default:
      return { entries: body.entries, profile: body.profile };
  }
}

export interface RunOptions {
  apiKey: string;
  enabledRateLimit: boolean;
  corsOrigin: string;
  /** ASR model override (env NVIDIA_ASR_MODEL), falls back to the default. */
  asrModel?: string;
}

export async function runCapability(
  capName: string,
  request: Request,
  opts: RunOptions
): Promise<Response> {
  const cap = CAPABILITIES[capName];
  if (!cap) return json(404, { error: `Unknown capability: ${capName}` });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const parsed = cap.schema.safeParse(body);
  if (!parsed.success) {
    return json(400, { error: 'Invalid request', details: parsed.error.flatten().fieldErrors });
  }
  body = parsed.data;

  // 2. cheap domain pre-filter
  if (anyOffDomain(...cap.guardFields(body))) {
    return refusal(opts.corsOrigin);
  }

  // 3. rate limit
  const userId = request.headers.get('x-user-id') ?? request.headers.get('cf-connecting-ip') ?? 'anonymous';
  const rate = await rateLimiter.acquire(userId, cap.kind);
  if (!rate.ok) {
    return new Response(JSON.stringify({ error: 'Intelligence unavailable — please try again shortly.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec), 'Access-Control-Allow-Origin': opts.corsOrigin },
    });
  }

  try {
    const ctx = await assembleContext('user-1', cap.capability, contextOptionsFor(cap.capability, body));
    const { messages, reasoning, extraHeaders } = cap.build(body, ctx);

    const gateway = new NvidiaGateway(opts.apiKey);
    const headers = {
      'Access-Control-Allow-Origin': opts.corsOrigin,
      'X-Reasoning-Profile': reasoning,
      ...(extraHeaders ?? {}),
    };

    return streamToResponse(
      gateway.streamCompletion(messages, { reasoning, signal: new AbortController().signal }),
      request,
      headers
    );
  } catch (err: any) {
    rateLimiter.release(rate.key);
    console.error(`[${capName}] error:`, err?.message ?? err);
    // If the key is missing / upstream unreachable, return a clean JSON error
    // (non-streaming) so the APK can surface it.
    return json(502, { error: 'Intelligence unavailable right now. Check NVIDIA_API_KEY and try again.' }, opts.corsOrigin);
  } finally {
    rateLimiter.release(rate.key);
  }
}

// ── Voice chat ─────────────────────────────────────────────────────────────────

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
function decodeAudioDataUrl(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/**
 * Voice Chat capability — POST /api/ai/voice-chat (Worker port of
 * server/routes/voiceChat.ts). Transcribes the clip via the ASR gateway under
 * the 'generative' rate-limit bucket (released right after transcription),
 * then runs the exact same chat pipeline with the transcript appended as the
 * newest user message and a leading `transcript` SSE event before any tokens.
 */
export async function runVoiceChat(request: Request, opts: RunOptions): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const parsed = VoiceChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(400, { error: 'Invalid request', details: parsed.error.flatten().fieldErrors });
  }
  const { audio, messages = [], context, entries, profile } = parsed.data;

  // 1. Rate limit BEFORE spending ASR + LLM credits. Transcription is the
  //    costliest step, so voice messages charge the tighter generative bucket.
  const userId = request.headers.get('x-user-id') ?? request.headers.get('cf-connecting-ip') ?? 'anonymous';
  const rate = await rateLimiter.acquire(userId, 'generative');
  if (!rate.ok) {
    return new Response(JSON.stringify({ error: 'Intelligence unavailable — please try again shortly.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec), 'Access-Control-Allow-Origin': opts.corsOrigin },
    });
  }

  // 2. Transcribe the clip. The generative slot is released as soon as the
  //    transcript exists, then the LLM reply re-enters the normal chat budget
  //    — so a single voice request never holds two concurrency slots at once.
  let transcript: string;
  try {
    const gateway = new NvidiaGateway(opts.apiKey, opts.asrModel);
    transcript = await gateway.transcribeAudio(decodeAudioDataUrl(audio));
  } catch (err: any) {
    if (String(err?.message ?? err) === 'No speech detected in the recording.') {
      return json(422, { error: 'No speech detected in the recording.' }, opts.corsOrigin);
    }
    console.error('[voice-chat] transcription error:', err?.message ?? err);
    return json(503, { error: 'Intelligence unavailable' }, opts.corsOrigin);
  } finally {
    rateLimiter.release(rate.key);
  }

  // 3. Run the exact same chat pipeline, with the transcript as the newest
  //    user message and a leading `transcript` event so the client can show
  //    what was heard while the reply streams in.
  const chatBody = { messages: [...messages, { role: 'user', content: transcript }], context, entries, profile };

  if (anyOffDomain(...CAPABILITIES['chat'].guardFields(chatBody))) {
    return refusal(opts.corsOrigin);
  }

  const convRate = await rateLimiter.acquire(userId, 'conversational');
  if (!convRate.ok) {
    return new Response(JSON.stringify({ error: 'Intelligence unavailable — please try again shortly.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(convRate.retryAfterSec), 'Access-Control-Allow-Origin': opts.corsOrigin },
    });
  }

  try {
    const ctx = await assembleContext('user-1', 'chat', contextOptionsFor('chat', chatBody));
    const { messages: modelMessages, reasoning } = CAPABILITIES['chat'].build(chatBody, ctx);

    const gateway = new NvidiaGateway(opts.apiKey);
    const headers = {
      'Access-Control-Allow-Origin': opts.corsOrigin,
      'X-Reasoning-Profile': reasoning,
    };

    return streamToResponse(
      gateway.streamCompletion(modelMessages, { reasoning, signal: new AbortController().signal }),
      request,
      headers,
      [`data: ${JSON.stringify({ transcript })}\n\n`]
    );
  } catch (err: any) {
    rateLimiter.release(convRate.key);
    console.error('[voice-chat] error:', err?.message ?? err);
    return json(503, { error: 'Intelligence unavailable' }, opts.corsOrigin);
  } finally {
    rateLimiter.release(convRate.key);
  }
}

function json(status: number, data: unknown, origin = '*'): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
  });
}

function refusal(origin: string): Response {
  const stream = new ReadableStream({
    start(c) {
      const enc = new TextEncoder();
      c.enqueue(enc.encode(`data: ${JSON.stringify({ text: GUARD_REFUSAL })}\n\n`));
      c.enqueue(enc.encode('data: [DONE]\n\n'));
      c.close();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': origin,
    },
  });
}
