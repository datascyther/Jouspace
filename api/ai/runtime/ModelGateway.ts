/**
 * Jouspace — AI Runtime: Model Gateway
 *
 * Single boundary to the NVIDIA Nemotron chat-completions API. Uses the
 * SERVER-ONLY NVIDIA_API_KEY (never shipped to the client). Mirrors the
 * request shape previously built in src/services/ai/providers/payload.ts.
 */

import type { ChatMode, ResponseMode, Role, StreamChunk } from './types';

interface GatewayMessage {
  role: Role;
  content: string;
}

function buildNvidiaPayload({
  model,
  messages,
  stream,
  mode = 'standard',
}: {
  model: string;
  messages: GatewayMessage[];
  stream: boolean;
  mode?: ChatMode;
}): string {
  const modeConfig = MODE_PARAMS[mode] ?? MODE_PARAMS.standard;
  return JSON.stringify({
    model,
    messages,
    temperature: modeConfig.temperature,
    top_p: 0.95,
    max_tokens: modeConfig.max_tokens,
    ...(modeConfig.reasoning_budget !== undefined
      ? { reasoning_budget: modeConfig.reasoning_budget }
      : {}),
    chat_template_kwargs: { enable_thinking: modeConfig.enable_thinking },
    stream,
  });
}

const MODE_PARAMS: Record<string, { temperature: number; max_tokens: number; reasoning_budget?: number; enable_thinking: boolean }> = {
  concise: {
    temperature: 0.7,
    max_tokens: 300,
    enable_thinking: false,
  },
  standard: {
    temperature: 0.6,
    max_tokens: 1200,
    reasoning_budget: 1200,
    enable_thinking: true,
  },
  deep: {
    temperature: 0.5,
    max_tokens: 16384,
    reasoning_budget: 16384,
    enable_thinking: true,
  },
};

/**
 * Parse an NVIDIA SSE stream into StreamChunks. The edge function re-emits
 * these as newline-delimited JSON downstream.
 */
async function* parseNvidiaSse(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<StreamChunk> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const withoutPrefix = trimmed.startsWith('data:')
          ? trimmed.slice(5).trim()
          : trimmed;
        if (!withoutPrefix || withoutPrefix === '[DONE]') continue;
        try {
          const parsed = JSON.parse(withoutPrefix);
          const delta =
            (typeof parsed?.choices?.[0]?.delta?.content === 'string' &&
              parsed.choices[0].delta.content) ||
            (typeof parsed?.choices?.[0]?.text === 'string' &&
              parsed.choices[0].text) ||
            (typeof parsed?.content === 'string' && parsed.content);
          if (typeof delta === 'string' && delta.length > 0) {
            yield { id: crypto.randomUUID(), contentDelta: delta };
          }
          if (
            parsed?.choices?.[0]?.finish_reason === 'stop' ||
            parsed?.done === true
          ) {
            return;
          }
        } catch {
          // Not JSON; ignore malformed keep-alive frames.
        }
      }
    }
  }
  yield { id: crypto.randomUUID(), contentDelta: '', done: true };
}

function readTimeoutMs(): number {
  const raw = Number(process.env.MODEL_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
}

export class ModelGateway {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private configured: boolean;
  private timeoutMs: number;

  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY ?? '';
    this.model = process.env.VITE_NVIDIA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b';
    this.baseUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
    this.timeoutMs = readTimeoutMs();
    // Do NOT throw at construction. A missing key degrades to a single
    // graceful error chunk at request time so the edge function never 500s
    // just because AI is unconfigured.
    this.configured = this.apiKey.length > 0;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async *streamCompletion(
    messages: GatewayMessage[],
    mode: ChatMode = 'standard',
    responseMode?: ResponseMode,
  ): AsyncGenerator<StreamChunk> {
    const effectiveMode: ChatMode = responseMode ?? mode;
    if (!this.configured) {
      yield {
        id: crypto.randomUUID(),
        contentDelta: '',
        done: true,
        error: 'AI model is not configured on the server (NVIDIA_API_KEY missing).',
      };
      return;
    }

    let lastError: unknown;
    // Bounded retry: 1 retry on transient failures (429/5xx/network/timeout).
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await this.fetchWithTimeout(messages, effectiveMode);
        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(`NVIDIA request failed (${res.status})`);
          if (attempt === 0) continue; // retry once
          yield { id: crypto.randomUUID(), contentDelta: '', done: true, error: (lastError as Error).message };
          return;
        }
        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => '');
          yield {
            id: crypto.randomUUID(),
            contentDelta: '',
            done: true,
            error: `NVIDIA request failed (${res.status}): ${errText}`,
          };
          return;
        }
        yield* parseNvidiaSse(res.body as ReadableStream<Uint8Array>);
        return;
      } catch (e) {
        lastError = e;
        if (attempt === 0) continue; // retry once
      }
    }

    const msg = lastError instanceof Error ? lastError.message : 'Unknown error contacting AI model.';
    yield { id: crypto.randomUUID(), contentDelta: '', done: true, error: msg };
  }

  private async fetchWithTimeout(
    messages: GatewayMessage[],
    mode: ChatMode,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: buildNvidiaPayload({ model: this.model, messages, stream: true, mode }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
