import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  getApiBaseUrl,
  isRuntimeConfigured,
  useJouspaceIntelligence,
  useAiInsight,
  useAiSummary,
  clearInsightSummaryCache,
} from './useJouspaceIntelligence';
import { journalStore } from '../store';

// ── SSE response helper ──────────────────────────────────────────────────────
// Builds a Response whose body is a valid SSE stream of the given `data:` chunks
// (each an already-serialized JSON object) followed by a [DONE] sentinel.

const encoder = new TextEncoder();

function makeSSEResponse(chunks: string[], withDone = true): Response {
  const parts = chunks.map((c) => `data: ${c}\n\n`);
  if (withDone) parts.push('data: [DONE]\n\n');
  const stream = new ReadableStream({
    start(controller) {
      for (const p of parts) controller.enqueue(encoder.encode(p));
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  clearInsightSummaryCache();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ── Runtime URL resolution ───────────────────────────────────────────────────

describe('getApiBaseUrl', () => {
  it('returns empty string in dev with no stored URL (relative → Vite proxy)', () => {
    vi.stubEnv('DEV', true);
    localStorage.removeItem('jouspace:runtimeUrl');
    expect(getApiBaseUrl()).toBe('');
  });

  it('returns the stored runtime URL when present', () => {
    vi.stubEnv('DEV', false);
    localStorage.setItem('jouspace:runtimeUrl', 'https://example.com/');
    expect(getApiBaseUrl()).toBe('https://example.com');
  });

  it('falls back to deployed runtime URL in production with no URL or build var', () => {
    vi.stubEnv('DEV', false);
    localStorage.removeItem('jouspace:runtimeUrl');
    expect(getApiBaseUrl()).toBe('https://jouspace-runtime.jouspace.workers.dev');
  });
});

describe('isRuntimeConfigured', () => {
  it('is true when DEV is stubbed true', () => {
    vi.stubEnv('DEV', true);
    localStorage.removeItem('jouspace:runtimeUrl');
    expect(isRuntimeConfigured()).toBe(true);
  });

  it('is true in production — falls back to deployed runtime URL', () => {
    vi.stubEnv('DEV', false);
    localStorage.removeItem('jouspace:runtimeUrl');
    expect(isRuntimeConfigured()).toBe(true);
  });
});

// ── Conversational hook (send) ───────────────────────────────────────────────

describe('useJouspaceIntelligence.send', () => {
  it('streams tokens into messages via relative /api/ai/chat in dev', async () => {
    vi.stubEnv('DEV', true);
    localStorage.removeItem('jouspace:runtimeUrl');
    fetchMock.mockReturnValue(
      Promise.resolve(makeSSEResponse(['{"text":"Hi"}']))
    );

    const { result } = renderHook(() => useJouspaceIntelligence('chat'));
    act(() => result.current.send('hello'));

    await waitFor(() =>
      expect(
        result.current.messages.some(
          (m) => m.role === 'assistant' && m.text === 'Hi'
        )
      ).toBe(true)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/chat',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

// ── One-shot hooks (insight / summarize) ─────────────────────────────────────

describe('useAiInsight / useAiSummary', () => {
  it('streams the insight text when enabled', async () => {
    vi.stubEnv('DEV', true);
    fetchMock.mockReturnValue(
      Promise.resolve(makeSSEResponse(['{"text":"You"}', '{"text":" return"}']))
    );

    const { result } = renderHook(() => useAiInsight(true));

    await waitFor(() => expect(result.current.text).toBe('You return'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/insight',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"entries"'),
      })
    );
  });

  it('streams the summary text and posts to /api/ai/summarize', async () => {
    vi.stubEnv('DEV', true);
    fetchMock.mockReturnValue(
      Promise.resolve(makeSSEResponse(['{"text":"A calm"}', '{"text":" month"}']))
    );

    const { result } = renderHook(() => useAiSummary(true));

    await waitFor(() => expect(result.current.text).toBe('A calm month'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/summarize',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('makes no request when disabled', async () => {
    vi.stubEnv('DEV', true);
    const { result } = renderHook(() => useAiInsight(false));

    // Give the effect a chance to (wrongly) fire, then assert it never did.
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.text).toBe('');
  });

  it('aborts the in-flight stream on unmount', async () => {
    vi.stubEnv('DEV', true);
    let captured: AbortSignal | undefined;
    let resolveStream: () => void = () => {};
    const pending = new Promise<void>((res) => {
      resolveStream = res;
    });

    fetchMock.mockImplementation((_url, opts) => {
      captured = (opts as { signal?: AbortSignal }).signal;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"text":"Hi"}\n\n'));
          pending.then(() => controller.close());
        },
      });
      return Promise.resolve(new Response(stream, { status: 200 }));
    });

    const { unmount } = renderHook(() => useAiInsight(true));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(captured).toBeInstanceOf(AbortSignal);
    expect(captured?.aborted).toBe(false);

    unmount();
    expect(captured?.aborted).toBe(true);
    resolveStream();
  });

  it('does not fetch in production when disabled (no runtime URL)', async () => {
    vi.stubEnv('DEV', false);
    localStorage.removeItem('jouspace:runtimeUrl');
    renderHook(() => useAiInsight(false));

    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('clientEntriesPayload integration', () => {
  it('sends the user’s real entries as context', async () => {
    vi.stubEnv('DEV', true);
    journalStore.save({
      id: 'e1',
      date: '2026-01-01',
      title: 'A test entry',
      theme: 'clarity',
      content: 'Thinking about focus.',
    });

    let postedBody = '';
    fetchMock.mockImplementation((_url, opts) => {
      postedBody = (opts as { body?: string }).body ?? '';
      return Promise.resolve(makeSSEResponse(['{"text":"ok"}']));
    });

    const { result } = renderHook(() => useAiInsight(true));
    await waitFor(() => expect(result.current.text).toBe('ok'));

    const parsed = JSON.parse(postedBody);
    expect(Array.isArray(parsed.entries)).toBe(true);
    expect(parsed.entries[0]).toMatchObject({
      id: 'e1',
      title: 'A test entry',
      theme: 'clarity',
    });

    journalStore.remove('e1');
  });
});
