/**
 * AI Service — Main Entry Point
 *
 * Provides a provider-agnostic interface for AI interactions.
 * The active provider can be swapped without changing application code.
 */

import type { AIProvider, AIResponse, AIStreamParams, AICompleteParams, AIMessage, StreamChunk } from './types';
import { AIError } from './types';
import { NvidiaProvider } from './providers/NvidiaProvider';
import { EdgeRuntimeProvider } from './providers/EdgeRuntimeProvider';
import { ZenMuxProvider } from './providers/ZenMuxProvider';
import { env } from '@/core/config/env';

export { AIError };

let activeProvider: AIProvider | null = null;

function getProvider(): AIProvider {
  if (!activeProvider) {
    const useEdge = env.useEdgeRuntime !== false;
    if (useEdge) {
      activeProvider = new EdgeRuntimeProvider();
    } else if (env.zenmuxApiKey) {
      activeProvider = new ZenMuxProvider();
    } else {
      activeProvider = new NvidiaProvider();
    }
  }
  return activeProvider;
}

class FallbackProvider implements AIProvider {
  readonly name = 'fallback';

  private directFallback(): AIProvider {
    return env.zenmuxApiKey ? new ZenMuxProvider() : new NvidiaProvider();
  }

  private async *streamWithFallback(params: AIStreamParams): AsyncGenerator<StreamChunk> {
    const primary = getProvider();
    try {
      yield* primary.streamChat(params);
      return;
    } catch (err) {
      if (primary.name !== 'edge-runtime') throw err;
      console.warn('[AI] Edge runtime unreachable, falling back to ZenMux:', (err as Error)?.message);
      yield* this.directFallback().streamChat(params);
    }
  }

  async *streamChat(params: AIStreamParams): AsyncGenerator<StreamChunk> {
    yield* this.streamWithFallback(params);
  }

  async generateResponse(params: AICompleteParams): Promise<AIResponse> {
    const primary = getProvider();
    try {
      return await primary.generateResponse(params);
    } catch (err) {
      if (primary.name !== 'edge-runtime') throw err;
      console.warn('[AI] Edge runtime unreachable, falling back to ZenMux:', (err as Error)?.message);
      return this.directFallback().generateResponse(params);
    }
  }
}

const fallbackProvider = new FallbackProvider();

/**
 * Probe the server-side AI Runtime once at startup to confirm the app is on the
 * edge path (which carries real-time web access + RAG + memory) rather than the
 * direct-NVIDIA fallback. The edge function streams chunks that include
 * `capabilities` and `toolsUsed`, so we read the first chunk to report status.
 *
 * This is observability only — it never changes streaming behavior. The result
 * is cached after the first call.
 */
let probeResult: { live: boolean; capabilities: string[]; tools: string[]; error?: string } | null = null;

export async function probeEdgeRuntime(uid = 'probe'): Promise<{
  live: boolean;
  capabilities: string[];
  tools: string[];
  error?: string;
}> {
  if (probeResult) return probeResult;

  const apiBase = env.apiBaseUrl;
  const url = apiBase.endsWith('/') ? `${apiBase}ai/chat` : `${apiBase}/ai/chat`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-uid': uid },
      body: JSON.stringify({ text: 'ping', uid, history: [], mode: 'standard' }),
    });

    if (!res.ok || !res.body) {
      probeResult = {
        live: false,
        capabilities: [],
        tools: [],
        error: `status ${res.status}`,
      };
      console.warn(`[AI] Edge runtime probe failed (${res.status}) — chat will use direct fallback (ZenMux or NVIDIA).`);
      return probeResult;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buf = '';
    let firstChunk: any = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        try {
          const parsed = JSON.parse(t);
          if (parsed.capabilities || parsed.toolsUsed) {
            firstChunk = parsed;
            break;
          }
        } catch {}
      }
      if (firstChunk) break;
    }
    // Drain the rest so the connection closes cleanly.
    try {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    } catch {}

    probeResult = {
      live: true,
      capabilities: firstChunk?.capabilities ?? [],
      tools: firstChunk?.toolsUsed ?? [],
    };
    console.log(
      `[AI] Edge runtime LIVE — capabilities: ${probeResult.capabilities.join(',') || '-'} tools: ${probeResult.tools.join(',') || '-'}`,
    );
    return probeResult;
  } catch (err) {
    probeResult = {
      live: false,
      capabilities: [],
      tools: [],
      error: (err as Error)?.message,
    };
    console.warn('[AI] Edge runtime probe error — chat will use direct fallback (ZenMux or NVIDIA):', (err as Error)?.message);
    return probeResult;
  }
}

/**
 * Set a custom AI provider (useful for testing or switching providers).
 */
export function setProvider(provider: AIProvider): void {
  activeProvider = provider;
}

/**
 * Get the current AI provider name.
 */
export function getProviderName(): string {
  return getProvider().name;
}

/**
 * Stream a chat response from the AI provider.
 */
export async function* streamChat(params: AIStreamParams): AsyncGenerator<StreamChunk> {
  yield* fallbackProvider.streamChat(params);
}

/**
 * Generate a complete (non-streaming) response.
 */
export async function generateResponse(params: AICompleteParams): Promise<AIResponse> {
  return fallbackProvider.generateResponse(params);
}

/**
 * Convert an array of AIMessages to the text + history format.
 */
export function messagesToParams(
  messages: AIMessage[],
  uid: string,
  signal?: AbortSignal
): AIStreamParams {
  const last = messages[messages.length - 1];
  const text = last?.content ?? '';
  const history = messages
    .slice(0, -1)
    .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
      m.role === 'user' || m.role === 'assistant'
    )
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  return { text, uid, history, signal };
}
