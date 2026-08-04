import type { AIProvider, AIStreamParams, AICompleteParams, AIResponse, StreamChunk } from '../types';
import { AIError } from '../types';
import { env } from '@/core/config/env';
import { buildContextualPrompt } from '@/prompts/mentalWellnessPrompt';
import { PerfTracker } from '@/utils/chat-performance';
import { buildNvidiaPayload } from './payload';
import { Platform } from 'react-native';

// ── Shared SSE line parser (no closure issues) ────────────────────────

let _globalChunk = 0;
function nextChunkId(): () => number {
  const start = ++_globalChunk;
  let i = 0;
  return () => start + (i++);
}

function* parseSSELine(line: string, id: () => number): Generator<StreamChunk> {
  const t = line.trim();
  if (!t) return;
  if (t === 'data: [DONE]') {
    yield { id: `c${id()}`, contentDelta: '', done: true };
    return;
  }
  const body = t.startsWith('data:') ? t.slice(5).trim() : t;
  if (!body || body === '[DONE]') return;
  try {
    const p = JSON.parse(body);
    const d = p?.choices?.[0]?.delta?.content || p?.choices?.[0]?.text || p?.content;
    if (typeof d === 'string' && d) yield { id: `c${id()}`, contentDelta: d };
    if (p?.choices?.[0]?.finish_reason === 'stop' || p?.done === true) {
      yield { id: `c${id()}`, contentDelta: '', done: true };
    }
  } catch {}
}

// ── Shared helpers for building requests ─────────────────────────────

function buildSystemMessage(memoryContext?: AIStreamParams['memoryContext']): { role: string; content: string } {
  return {
    role: 'system',
    content: buildContextualPrompt({
      userName: memoryContext?.userName,
      timeOfDay: memoryContext?.timeOfDay as any,
      returningUser: memoryContext?.returningUser,
      previousMood: memoryContext?.previousMood,
      preferredTone: memoryContext?.preferredTone as any,
    }),
  };
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

function getApiKey(): string {
  const key = env.nvidiaApiKey;
  if (!key) {
    throw new AIError('NVIDIA API key not configured', 500, 'Set VITE_NVIDIA_API_KEY in your .env');
  }
  return key;
}

export class NvidiaProvider implements AIProvider {
  readonly name = 'nvidia-nim';

  async *streamChat(params: AIStreamParams): AsyncGenerator<StreamChunk> {
    const perf = new PerfTracker(params.uid);
    perf.mark('send');

    const apiKey = getApiKey();
    const targetUrl = `${env.nvidiaBaseUrl}/chat/completions`;

    const messages: Array<{ role: string; content: string }> = [
      buildSystemMessage(params.memoryContext),
      ...(params.history || []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: params.text },
    ];

    const requestBody = buildNvidiaPayload({
      model: env.nvidiaModel || 'nvidia/nemotron-3-ultra-550b-a55b',
      messages,
      stream: true,
      mode: params.mode,
    });
    const headers = buildHeaders(apiKey);
    perf.mark('request_start');

    // ── Try fetch + ReadableStream (web only) ────────────────────
    if (Platform.OS === 'web' && globalThis.fetch && typeof globalThis.ReadableStream !== 'undefined') {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: params.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new AIError('AI request failed', res.status, errText);
      }

      if (res.body && typeof res.body.getReader === 'function') {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        const id = nextChunkId();
        let hasFirstToken = false;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split(/\r?\n/);
          buf = lines.pop() ?? '';
          for (const line of lines) {
            for (const c of parseSSELine(line, id)) {
              if (c.contentDelta && !hasFirstToken) { hasFirstToken = true; perf.mark('first_token'); }
              yield c;
              if (c.done) { perf.report(); return; }
            }
          }
        }
        if (buf.trim()) {
          for (const c of parseSSELine(buf, id)) {
            if (c.contentDelta && !hasFirstToken) perf.mark('first_token');
            yield c;
            if (c.done) { perf.report(); return; }
          }
        }
        perf.mark('complete');
        perf.report();
        return;
      }
      // body null — fall through to XHR
    }

    // ── XHR streaming (React Native) ─────────────────────────────

    yield* this.streamViaXHR(targetUrl, headers, requestBody, params.signal, perf);
  }

  private async *streamViaXHR(
    url: string,
    headers: Record<string, string>,
    body: string,
    signal: AbortSignal | undefined,
    perf: PerfTracker | undefined,
  ): AsyncGenerator<StreamChunk> {
    type Evt = { kind: 'data'; text: string } | { kind: 'end' } | { kind: 'error'; err: Error };

    let pending: Evt[] = [];
    let waiter: ((e: Evt) => void) | null = null;
    let done = false;
    let streamError: Error | null = null;

    const push = (e: Evt) => {
      if (waiter) { waiter(e); waiter = null; }
      else pending.push(e);
    };

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    
    const requestHeaders = {
      ...headers,
      'Accept': 'text/event-stream',
    };
    for (const [k, v] of Object.entries(requestHeaders)) xhr.setRequestHeader(k, v);
    xhr.responseType = 'text';

    let lastIdx = 0;

    xhr.onprogress = () => {
      const text = xhr.responseText.slice(lastIdx);
      lastIdx = xhr.responseText.length;
      if (text) push({ kind: 'data', text });
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      done = true;
      perf?.mark('complete');
      if (xhr.status >= 200 && xhr.status < 300) {
        push({ kind: 'end' });
      } else if (xhr.status === 0) {
        streamError = new AIError('Connection lost. The request could not reach the server or was interrupted.', 0, xhr.responseText);
        push({ kind: 'error', err: streamError });
      } else {
        streamError = new AIError('AI request failed', xhr.status, xhr.responseText);
        push({ kind: 'error', err: streamError });
      }
    };

    xhr.onerror = () => {
      done = true;
      streamError = new Error('Network request failed');
      push({ kind: 'error', err: streamError });
    };

    xhr.send(body);

    const cleanup: (() => void)[] = [];

    if (signal) {
      const onAbort = () => { xhr.abort(); done = true; const abortErr = new Error('Aborted'); abortErr.name = 'AbortError'; push({ kind: 'error', err: abortErr }); };
      signal.addEventListener('abort', onAbort);
      cleanup.push(() => signal.removeEventListener('abort', onAbort));
    }

    const id = nextChunkId();
    let buf = '';
    let hasFirstToken = false;

    try {
      while (!done || pending.length > 0) {
        let evt: Evt;
        if (pending.length > 0) evt = pending.shift()!;
        else if (done) break;
        else evt = await new Promise<Evt>((r) => { waiter = r; });

        if (evt.kind === 'error') throw evt.err;
        if (evt.kind === 'end') break;

        buf += evt.text;
        const lines = buf.split(/\r?\n/);
        buf = lines.pop() ?? '';

        for (const line of lines) {
          for (const c of parseSSELine(line, id)) {
            if (c.contentDelta && !hasFirstToken) { hasFirstToken = true; perf?.mark('first_token'); }
            yield c;
            if (c.done) { perf?.report(); return; }
          }
        }
      }

      if (buf.trim()) {
        for (const c of parseSSELine(buf, id)) {
          if (c.contentDelta && !hasFirstToken) perf?.mark('first_token');
          yield c;
          if (c.done) { perf?.report(); return; }
        }
      }
    } finally {
      for (const c of cleanup) c();
    }

    perf?.report();
  }

  async generateResponse(params: AICompleteParams): Promise<AIResponse> {
    const apiKey = getApiKey();
    const targetUrl = `${env.nvidiaBaseUrl}/chat/completions`;

    const messages: Array<{ role: string; content: string }> = [
      buildSystemMessage(params.memoryContext),
      ...(params.history || []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: params.text },
    ];

    const requestBody = buildNvidiaPayload({
      model: env.nvidiaModel || 'nvidia/nemotron-3-ultra-550b-a55b',
      messages,
      stream: false,
      mode: params.mode,
    });
    const headers = buildHeaders(apiKey);

    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: params.signal,
      });
    } catch (err) {
      if (err instanceof TypeError && (err.message.includes('Network') || err.message.includes('fetch'))) {
        throw new AIError('Network request failed', 0, null);
      }
      throw err;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new AIError('AI request failed', res.status, errText);
    }

    const raw = await res.text();
    // Some endpoints return SSE even when stream=false; detect and handle
    if (raw.startsWith('data:') || raw.includes('\ndata:')) {
      let content = '';
      for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t === 'data: [DONE]') continue;
        const body = t.startsWith('data:') ? t.slice(5).trim() : t;
        if (!body || body === '[DONE]') continue;
        try {
          const p = JSON.parse(body);
          const d = p?.choices?.[0]?.delta?.content || p?.choices?.[0]?.text || p?.choices?.[0]?.message?.content || p?.content;
          if (typeof d === 'string') content += d;
        } catch {}
      }
      return { content };
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new AIError('AI request failed — unexpected response format', 0, raw.slice(0, 500));
    }
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.content || '';
    return { content };
  }
}

export default NvidiaProvider;
