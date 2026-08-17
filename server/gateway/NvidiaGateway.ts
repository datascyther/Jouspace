/**
 * NvidiaGateway — ModelGateway implementation for NVIDIA NIM (hosted)
 *
 * Uses the OpenAI-compatible NVIDIA hosted API at integrate.api.nvidia.com.
 * Two-model routing:
 * - fast profile   → nvidia/nemotron-3-nano-30b-a3b (small, instant replies,
 *                    no thinking params)
 * - balanced/deep  → nvidia/nemotron-3.5-lightning-30b-a3b (main workhorse,
 *                    thinking enabled via chat_template_kwargs.enable_thinking)
 * If the fast model fails before the first content token (and the request was
 * not aborted), the stream retries once with the balanced profile.
 *
 * Key behaviours:
 * - API key is read from process.env.NVIDIA_API_KEY — never forwarded to clients
 * - chat_template_kwargs.enable_thinking routes chain-of-thought into
 *   reasoning_content; reasoning_budget controls its depth
 * - reasoning_content chunks (chain-of-thought) are silently consumed and discarded
 * - Only content chunks are yielded to the runtime
 * - The final chunk has done: true
 */

import OpenAI from 'openai';
import { Agent, fetch as undiciFetch } from 'undici';
import type { ModelGateway, ModelMessage, GatewayStreamChunk } from './ModelGateway.js';
import type { ReasoningProfile } from '../reasoning.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const LIGHTNING_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
const FAST_MODEL = 'nvidia/nemotron-3-nano-30b-a3b';

/**
 * Custom undici dispatcher used for every runtime → NVIDIA call.
 *
 * NVIDIA is slow + load-throttled (observed 60s+ to first token, abrupt
 * connection resets under load). The default socket timeouts turn that into a
 * `read ETIMEDOUT` that aborts the whole stream. Disabling the idle/body
 * timeouts and giving a bounded connect timeout lets the long silent
 * "thinking" gap survive. We use undici's OWN `fetch` (not Node's global
 * `fetch`) so the Agent/dispatcher is the same undici instance — undici
 * validates `dispatcher instanceof Dispatcher` from its own module, so a
 * dispatcher built elsewhere would throw.
 */
const nvidiaDispatcher = new Agent({
  connectTimeout: 30_000,
  headersTimeout: 0, // never time out waiting for/among tokens
  bodyTimeout: 0, // never time out during a long silent "thinking" gap
});

/**
 * Per-profile provider params.
 *
 * The fast profile MUST NOT carry chat_template_kwargs/reasoning_budget — they
 * re-enable the full chain-of-thought path (and non-reasoning models reject
 * them with a 400, as seen with mini-4b). The reasoning profiles keep the
 * thinking path on via chat_template_kwargs.enable_thinking; reasoning_budget
 * bounds how much chain-of-thought is spent. Headroom rule: balanced sets
 * max_tokens (8192) strictly above reasoning_budget (4096) so the visible
 * answer keeps headroom even if reasoning tokens count against max_tokens.
 * deep intentionally sets reasoning_budget == max_tokens (16384/16384, per
 * spec) — if end-to-end probing reveals truncated visible answers, raise deep
 * max_tokens above the budget as a follow-up tweak.
 * temperature / top_p stay constant to preserve the Jouspace voice.
 */
type ProfileParams = {
  model: string;
  max_tokens: number;
  chat_template_kwargs?: { enable_thinking: boolean };
  reasoning_budget?: number;
};

const PROFILE_PARAMS: Record<ReasoningProfile, ProfileParams> = {
  fast: { model: FAST_MODEL, max_tokens: 2560 },
  balanced: {
    model: LIGHTNING_MODEL,
    chat_template_kwargs: { enable_thinking: true },
    reasoning_budget: 4096,
    max_tokens: 8192,
  },
  deep: {
    model: LIGHTNING_MODEL,
    chat_template_kwargs: { enable_thinking: true },
    reasoning_budget: 16384,
    max_tokens: 16384,
  },
};

export class NvidiaGateway implements ModelGateway {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error(
        'NVIDIA_API_KEY is not set. Add it to your .env file in the project root.'
      );
    }
    this.client = new OpenAI({
      baseURL: NVIDIA_BASE_URL,
      apiKey,
      // NOTE: do NOT pass `timeout: 0` here. The OpenAI SDK turns a 0 into
      // `AbortSignal.timeout(0)`, which fires *immediately* ("Request timed
      // out"), not "no limit". We instead set a hard client cap safely above
      // the 9-minute StreamController ceiling so the ceiling always wins.
      timeout: 10 * 60 * 1000,
      // Survive a transient NVIDIA reset/throttle once (tunable).
      maxRetries: 1,
      // Route every call through undici's own fetch + our dispatcher (see
      // nvidiaDispatcher note). undici's Response is API-compatible with the
      // SDK's expected global Response at runtime; we annotate the params with
      // the global fetch signature and cast the whole function so TypeScript
      // accepts undici's own fetch.
      fetch: ((url: string | URL | Request, init?: RequestInit) =>
        undiciFetch(url as Parameters<typeof undiciFetch>[0], {
          ...(init as Parameters<typeof undiciFetch>[1]),
          dispatcher: nvidiaDispatcher,
        })) as unknown as (
          url: string | URL | Request,
          init?: RequestInit
        ) => Promise<Response>,
    });
  }

  /**
   * Single attempt at streaming a completion: create the upstream stream and
   * yield only visible content tokens. reasoning_content (chain-of-thought)
   * is silently consumed — this includes nano-30b-a3b's CoT chunks. Does not
   * emit the final `done: true` chunk; the caller owns the completion signal
   * so fallback logic can decide when the stream truly ends.
   */
  private async *streamAttempt(
    messages: ModelMessage[],
    profile: ProfileParams,
    signal?: AbortSignal
  ): AsyncGenerator<GatewayStreamChunk> {
    // chat_template_kwargs and reasoning_budget are provider-specific top-level
    // params on integrate.api.nvidia.com, so they are not part of the base
    // OpenAI ChatCompletion types. We intersect the streaming params type with
    // the provider fields — the base properties remain fully checked while the
    // NVIDIA-only keys are permitted. The runtime request body is unchanged.
    const body = {
      model: profile.model,
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: profile.max_tokens,
      stream: true,
    } as OpenAI.Chat.ChatCompletionCreateParamsStreaming & {
      chat_template_kwargs?: { enable_thinking: boolean };
      reasoning_budget?: number;
    };

    // Thinking params are added conditionally so the fast lane stays truly
    // light (they would re-enable the full chain-of-thought path, and
    // non-reasoning models reject them with a 400).
    if (profile.chat_template_kwargs) body.chat_template_kwargs = profile.chat_template_kwargs;
    if (profile.reasoning_budget) body.reasoning_budget = profile.reasoning_budget;

    // IMPORTANT: `signal` must be a RequestOptions (2nd arg), NOT part of the
    // request body. If spread into the body, NVIDIA rejects it as an
    // "Unsupported parameter(s): signal" 400. As a RequestOption the SDK
    // forwards it into the (undici) fetch init, so the 9-minute ceiling abort
    // in StreamController still reaches the upstream.
    const stream = await this.client.chat.completions.create(
      body,
      signal ? { signal } : {}
    );

    for await (const chunk of stream) {
      if (!chunk.choices || chunk.choices.length === 0) continue;

      const delta = chunk.choices[0].delta as OpenAI.ChatCompletionChunk.Choice.Delta & {
        reasoning_content?: string;
      };

      // Silently consume reasoning_content — chain-of-thought must never
      // reach the frontend. The model's internal reasoning improves answer
      // quality but is not surfaced in the Jouspace UI.
      if (delta.reasoning_content) {
        continue; // consumed, not yielded
      }

      // Yield only the visible content tokens
      if (delta.content) {
        yield { text: delta.content, done: false };
      }
    }
  }

  async *streamCompletion(
    messages: ModelMessage[],
    opts: { reasoning?: ReasoningProfile; signal?: AbortSignal } = {}
  ): AsyncIterable<GatewayStreamChunk> {
    let profile = PROFILE_PARAMS[opts.reasoning ?? 'balanced'];
    let yieldedAny = false;

    try {
      for await (const chunk of this.streamAttempt(messages, profile, opts.signal)) {
        if (!chunk.done) yieldedAny = true;
        yield chunk;
      }
    } catch (err) {
      // Fast-lane safety net: if the small model fails before any content
      // token (and the request wasn't aborted), retry once with the balanced
      // lightning profile. Partial streams are never replayed (`yieldedAny` guard).
      if (profile.model === FAST_MODEL && !yieldedAny && !opts.signal?.aborted) {
        profile = PROFILE_PARAMS['balanced'];
        for await (const chunk of this.streamAttempt(messages, profile, opts.signal)) {
          if (!chunk.done) yieldedAny = true;
          yield chunk;
        }
      } else {
        throw err;
      }
    }

    // Signal stream completion exactly once, after a successful attempt.
    yield { text: '', done: true };
  }
}
