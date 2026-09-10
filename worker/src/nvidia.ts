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
 * Uses one verified instruct model for every reasoning profile, silently drops
 * reasoning_content, and yields only visible content.
 * Also hosts transcribeAudio() for voice chat (multipart POST to
 * /v1/audio/transcriptions, returns the trimmed transcript).
 */

import type { ModelMessage, GatewayStreamChunk } from '../../server/types.js';
import type { ReasoningProfile } from '../../server/reasoning.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const JOURNAL_MODEL = 'meta/llama-3.2-11b-vision-instruct';
// Hosted ASR model for voice chat. NVIDIA serves speech NIMs (Parakeet family,
// Whisper, Canary) from the same integrate.api.nvidia.com base + key used for
// LLM inference. Parakeet is English-first and low-latency; override with the
// NVIDIA_ASR_MODEL env binding to switch (e.g. nvidia/whisper-large-v3 for
// multilingual).
const DEFAULT_ASR_MODEL = 'nvidia/parakeet-tdt-0.6b-v3';

type ProfileParams = {
  model: string;
  max_tokens: number;
};

const PROFILE_PARAMS: Record<ReasoningProfile, ProfileParams> = {
  fast: { model: JOURNAL_MODEL, max_tokens: 2560 },
  balanced: { model: JOURNAL_MODEL, max_tokens: 8192 },
  deep: { model: JOURNAL_MODEL, max_tokens: 16384 },
};

export class NvidiaGateway {
  constructor(
    private readonly apiKey: string,
    private readonly asrModel: string = DEFAULT_ASR_MODEL
  ) {
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
      throw err;
    }

    yield { text: '', done: true };
  }

  /**
   * Transcribe a mono 16-bit PCM WAV clip via the hosted NVIDIA ASR NIM.
   * POSTs multipart form data (file + model) to /v1/audio/transcriptions —
   * the same OpenAI-compatible surface NVIDIA exposes for its speech models.
   * Returns the trimmed transcript text.
   */
  async transcribeAudio(bytes: Uint8Array): Promise<string> {
    const form = new FormData();
    // Copy into a fresh ArrayBuffer-backed view so TS accepts it as a BlobPart.
    form.append('file', new File([new Uint8Array(bytes)], 'recording.wav', { type: 'audio/wav' }));
    form.append('model', this.asrModel);
    form.append('response_format', 'json');

    const res = await fetch(`${NVIDIA_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`NVIDIA upstream error ${res.status}: ${text.slice(0, 200)}`);
    }

    const payload = (await res.json()) as { text?: string };
    const transcript = (payload?.text ?? '').trim();
    if (!transcript) {
      throw new Error('No speech detected in the recording.');
    }
    return transcript;
  }
}
