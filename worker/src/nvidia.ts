/**
 * nvidia.ts — Worker-native NVIDIA NIM gateway (replaces server/gateway/NvidiaGateway.ts)
 *
 * Differences from the Node version:
 *  - Uses the global `fetch` (no `openai` SDK, no `undici` Agent). Workers don't
 *    support undici's custom Agent, but native fetch + AbortSignal handles long
 *    streams perfectly well.
 *  - Inputs (apiKey, reasoning profile) are passed in explicitly instead of read
 *    from process.env, because Workers expose config via the `env` binding.
 *
 * Behaviour (unchanged): two-model routing, reasoning_content silently dropped,
 * fast-model failure → one retry on balanced. Yields only visible content.
 */

import type { ModelMessage, GatewayStreamChunk } from '../../server/types.js';
import type { ReasoningProfile } from '../../server/reasoning.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const LIGHTNING_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
const FAST_MODEL = 'nvidia/nemotron-3-nano-30b-a3b';

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

export class NvidiaGateway {
  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY is not set (configure it as a Worker secret).');
    }
  }

  /**
   * One streaming attempt. Yields only visible content; reasoning_content is
   * consumed and discarded. Does NOT emit the final done:true (caller owns it).
   */
  private async *streamAttempt(
    messages: ModelMessage[],
    profile: ProfileParams,
    signal?: AbortSignal
  ): AsyncGenerator<GatewayStreamChunk> {
    const body: Record<string, unknown> = {
      model: profile.model,
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: profile.max_tokens,
      stream: true,
    };
    if (profile.chat_template_kwargs) body.chat_template_kwargs = profile.chat_template_kwargs;
    if (profile.reasoning_budget) body.reasoning_budget = profile.reasoning_budget;

    const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(`NVIDIA upstream error ${res.status}: ${text.slice(0, 200)}`);
    }

    // NVIDIA streams SSE: lines `data: {json}` ending with `data: [DONE]`.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta ?? {};
          if (delta.reasoning_content) continue; // drop chain-of-thought
          if (delta.content) yield { text: delta.content, done: false };
        } catch {
          // Ignore malformed keep-alive / partial chunks.
        }
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
      // Fast-lane safety net: retry once on balanced if no token was emitted
      // and the request wasn't aborted by the client.
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

    yield { text: '', done: true };
  }
}
