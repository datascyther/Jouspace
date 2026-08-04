/**
 * Jouspace — AI Provider: Edge Runtime
 *
 * Routes all chat traffic through the server-side AI Runtime (api/ai/chat.ts)
 * instead of calling NVIDIA directly. Keeps the LLM + search keys server-side.
 * Implements the existing AIProvider contract so the rest of the app is
 * unchanged. Parses the edge runtime's newline-delimited JSON stream
 * (each line: { id, contentDelta, done?, citations? }).
 */

import type { AIProvider, AIStreamParams, AICompleteParams, AIResponse, StreamChunk } from '../types';
import { AIError } from '../types';
import { env } from '@/core/config/env';

export class EdgeRuntimeProvider implements AIProvider {
  readonly name = 'edge-runtime';

  async *streamChat(params: AIStreamParams): AsyncGenerator<StreamChunk> {
    const apiBase = env.apiBaseUrl;
    const url = apiBase.endsWith('/') ? `${apiBase}ai/chat` : `${apiBase}/ai/chat`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-uid': params.uid,
      },
      body: JSON.stringify({
        text: params.text,
        history: params.history,
        mode: params.mode,
        memoryContext: params.memoryContext,
      }),
      signal: params.signal,
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => '');
      throw new AIError('AI request failed', res.status, errText);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let citations: import('@/features/chat/types/Message').MessageSource[] | undefined;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as StreamChunk & {
            citations?: import('@/features/chat/types/Message').MessageSource[];
          };
          if (parsed.citations && parsed.citations.length) {
            citations = parsed.citations;
          }
          if (typeof parsed.contentDelta === 'string') {
            yield { id: parsed.id, contentDelta: parsed.contentDelta, done: parsed.done };
          }
          if (parsed.done) {
            // Re-emit a synthetic terminal chunk carrying citations for the UI.
            if (citations) yield { id: parsed.id, contentDelta: '', done: true, citations } as any;
            return;
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
  }

  async generateResponse(params: AICompleteParams): Promise<AIResponse> {
    let content = '';
    for await (const chunk of this.streamChat(params)) {
      content += chunk.contentDelta;
    }
    return { content };
  }
}

export default EdgeRuntimeProvider;
