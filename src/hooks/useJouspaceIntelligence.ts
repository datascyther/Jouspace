/**
 * useJouspaceIntelligence
 *
 * The single frontend interface to the Jouspace Intelligence Runtime.
 * All AI surfaces (chat, reflect, insight, future capabilities) use this hook.
 *
 * The hook:
 * - Sends requests to /api/ai/<capability>
 * - Reads the SSE stream and accumulates tokens into message state
 * - Drives the isThinking and isStreaming UI states that already exist
 *   in AIScreenContent and AIReflectScreen
 * - Supports abort (user can cancel mid-stream)
 *
 * The frontend never sees the model, the API key, or provider details.
 * It only sees: messages, send(), isThinking, isStreaming, abort(), error.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { journalStore } from '../store';
import { getAIProfilePayload, getAnonId } from '../lib/personalization';

// ── Runtime endpoint ──────────────────────────────────────────────────────────
// The Intelligence Runtime base URL is read LAZILY on every request so the
// user-supplied value (localStorage 'jouspace:runtimeUrl', edited in Profile)
// takes effect immediately, overriding the build-time VITE_API_BASE_URL.
// In dev, with no URL set and no build var, the Vite proxy forwards
// /api → localhost:3001. For a deployed APK/PWA, the user sets their runtime
// URL in Profile, or the build is configured with VITE_API_BASE_URL.
// Deployed Jouspace Intelligence Runtime (Cloudflare Worker). Used as the
// production default so the AI chat works out-of-the-box without the user
// manually setting a runtime URL in Profile.
export const DEFAULT_RUNTIME_URL = 'https://jouspace-runtime.jouspace.workers.dev';

export const RUNTIME_URL_STORAGE_KEY = 'jouspace:runtimeUrl';

export function getApiBaseUrl(): string {
  const stored = localStorage.getItem(RUNTIME_URL_STORAGE_KEY)?.trim();
  if (stored) return stored.replace(/\/+$/, '');
  const build = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (build) return build.replace(/\/+$/, '');
  // In dev, with no explicit URL, default to relative so requests hit /api/...
  // and the Vite proxy forwards them to the local runtime (localhost:3001).
  if (import.meta.env.DEV) return '';
  // Production: fall back to the deployed Runtime so the AI chat works without
  // manual configuration (CSP + fetch paths both resolve to the worker).
  return DEFAULT_RUNTIME_URL;
}

/** True when a runtime URL is configured (Profile field or build var), or dev. */
export function isRuntimeConfigured(): boolean {
  return getApiBaseUrl() !== '' || import.meta.env.DEV;
}

export const RUNTIME_UNAVAILABLE_MESSAGE =
  'AI unavailable — set a runtime URL in Profile to enable reflections.';

// ── Chat history persistence (localStorage) ──────────────────────────────────
// The 'chat' conversation survives tab navigation by being persisted here.
// 'reflect' stays ephemeral (reset on close). A partial/aborted assistant
// message is never stored because the hook only persists when idle.

export const CHAT_STORAGE_KEY = 'jouspace:ai:chat:messages';

export function loadChatMessages(): IntelligenceMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as IntelligenceMessage[];
  } catch {
    /* corrupt JSON → start clean */
  }
  return [];
}

function saveChatMessages(messages: IntelligenceMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* storage failure → non-fatal */
  }
}

function clearChatMessages(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface IntelligenceMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp?: string;
  /** Citations are populated by the UI layer, not the runtime */
  citationCount?: number;
  citationDates?: string[];
}

export type Capability = 'chat' | 'reflect';

export interface ChatSendOptions {
  /** Extra context fields forwarded to the runtime */
  context?: { entryId?: string };
}

export interface ReflectSendOptions {
  /** The insight being reflected on — required for reflect capability */
  insight: string;
  /** Optional initial user thought */
  userThought?: string;
}

export type SendOptions = ChatSendOptions | ReflectSendOptions;

export interface UseJouspaceIntelligenceReturn {
  messages: IntelligenceMessage[];
  /** True while waiting for the first token (thinking indicator) */
  isThinking: boolean;
  /** True while tokens are actively streaming */
  isStreaming: boolean;
  /** Non-null if the last request encountered an error */
  error: string | null;
  /** Send a user message and start streaming the response */
  send: (userText: string, options?: SendOptions) => void;
  /** Cancel the in-flight stream */
  abort: () => void;
  /** Clear message history */
  reset: () => void;
}

// ── Client context payload ────────────────────────────────────────────────────
// Local-first: the device is the source of truth, so each request sends the
// user's real journal entries as AI context. The runtime stays stateless.

function clientEntriesPayload(): {
  id: string;
  date: string;
  title: string;
  theme: string;
  content: string;
}[] {
  return journalStore
    .list()
    .slice(0, 20)
    .map((e) => ({
      id: e.id,
      date: e.date,
      title: e.title,
      theme: e.theme,
      content: e.content,
    }));
}

export type ClientEntry = ReturnType<typeof clientEntriesPayload>[number];

// ── SSE parsing ───────────────────────────────────────────────────────────────

export function parseSSELine(
  line: string
): { text?: string; transcript?: string; error?: string; done?: boolean } | null {
  if (!line.startsWith('data: ')) return null;
  const payload = line.slice(6).trim();
  if (payload === '[DONE]') return { done: true };
  try {
    const obj = JSON.parse(payload) as {
      text?: string;
      transcript?: string;
      error?: string;
    };
    return {
      ...(obj.text !== undefined ? { text: obj.text } : {}),
      ...(obj.transcript !== undefined ? { transcript: obj.transcript } : {}),
      ...(obj.error !== undefined ? { error: obj.error } : {}),
    };
  } catch {
    return null;
  }
}

// ── Shared stream reader ──────────────────────────────────────────────────────
// `send` (text chat) consumes this SSE wire format; the read loop + transient
// retry live here once.

type SSEMessage =
  | { kind: 'done' }
  | { kind: 'error'; message: string }
  | { kind: 'text'; text: string };

async function readSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: SSEMessage) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines, keeping the last (possibly incomplete) line
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const parsed = parseSSELine(line);
      if (!parsed) continue;

      if (parsed.done) {
        onEvent({ kind: 'done' });
        return;
      }
      if (parsed.error) {
        onEvent({ kind: 'error', message: parsed.error });
        return;
      }
      if (parsed.text !== undefined) {
        onEvent({ kind: 'text', text: parsed.text });
      }
    }
  }
}

/**
 * POST an AI request body and pipe the SSE response to `onEvent`.
 * On transient failure (network error or 5xx) retries exactly once — but ONLY
 * before the first event has arrived. Retrying after a mid-stream failure would
 * append a second assistant bubble (or re-transcribe a voice clip).
 */
async function streamChatResponse(options: {
  base: string;
  path: string;
  body: Record<string, unknown>;
  controller: AbortController;
  onEvent: (event: SSEMessage) => void;
}): Promise<void> {
  const { base, path, body, controller, onEvent } = options;

  const doFetch = async (): Promise<Response> => {
    const resp = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': getAnonId(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      const message =
        (errBody as { error?: string }).error ?? `HTTP ${resp.status}`;
      throw Object.assign(new Error(message), { status: resp.status });
    }
    return resp;
  };

  let receivedEvent = false;
  const track: typeof onEvent = (event) => {
    receivedEvent = true;
    onEvent(event);
  };

  let response: Response;
  try {
    response = await doFetch();
  } catch (err) {
    const status = (err as { status?: number }).status;
    const transient =
      (err as Error).name !== 'AbortError' &&
      (status === undefined || status >= 500);
    if (!receivedEvent && transient) {
      await new Promise((r) => setTimeout(r, 800));
      response = await doFetch();
    } else {
      throw err;
    }
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');
  await readSSE(reader, track);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useJouspaceIntelligence(
  capability: Capability,
  initialMessages: IntelligenceMessage[] = []
): UseJouspaceIntelligenceReturn {
  const [messages, setMessages] = useState<IntelligenceMessage[]>(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable ref to the current AbortController so abort() can cancel mid-stream
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsThinking(false);
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abort();
    if (capability === 'chat') clearChatMessages();
    setMessages(initialMessages);
    setError(null);
  }, [abort, capability, initialMessages]);

  const send = useCallback(
    (userText: string, options?: SendOptions) => {
      const trimmed = userText.trim();
      if (!trimmed) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: IntelligenceMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsThinking(true);
      setIsStreaming(false);
      setError(null);

      // No runtime configured (and no build-time URL, and not dev) → degrade
      // gracefully instead of firing a doomed request. In dev an empty base
      // means a relative /api/... call handled by the Vite proxy.
      const base = getApiBaseUrl();
      if (!base && !import.meta.env.DEV) {
        setIsThinking(false);
        setError(RUNTIME_UNAVAILABLE_MESSAGE);
        return;
      }

      // Build request body based on capability.
      // Both branches include the client's real journal entries so the runtime
      // reflects the user's actual writing, not server-side seed data.
      const body: Record<string, unknown> =
        capability === 'reflect'
          ? {
              insight: (options as ReflectSendOptions)?.insight ?? trimmed,
              userThought: (options as ReflectSendOptions)?.userThought,
              history: [], // Fresh reflect sessions start clean
              entries: clientEntriesPayload(),
              profile: getAIProfilePayload(),
            }
          : {
              messages: [
                // Include prior conversation + new user message
                ...messages
                  .filter((m) => m.role === 'user' || m.role === 'assistant')
                  .map((m) => ({ role: m.role, content: m.text })),
                { role: 'user', content: trimmed },
              ],
              context: (options as ChatSendOptions)?.context,
              entries: clientEntriesPayload(),
              profile: getAIProfilePayload(),
            };

      // Placeholder assistant message — text will be streamed in
      const assistantId = `a-${Date.now()}`;
      let firstChunk = true;

      (async () => {
        try {
          await streamChatResponse({
            base,
            path: `/api/ai/${capability}`,
            body,
            controller,
            onEvent: (event) => {
              if (event.kind === 'done') return;
              if (event.kind === 'error') {
                setError(event.message);
                return;
              }
              if (event.kind === 'text') {
                if (firstChunk) {
                  // Transition from thinking → streaming on the first real token
                  firstChunk = false;
                  setIsThinking(false);
                  setIsStreaming(true);
                  // Insert the placeholder assistant message
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantId,
                      role: 'assistant' as const,
                      text: event.text,
                    },
                  ]);
                } else {
                  // Accumulate subsequent tokens into the assistant message
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, text: m.text + event.text }
                        : m
                    )
                  );
                }
              }
            },
          });
        } catch (err) {
          if ((err as Error).name === 'AbortError') return; // User cancelled
          console.error('[useJouspaceIntelligence]', err);
          setError(
            (err as Error).message ||
              'Jouspace Intelligence is unavailable. Please try again.'
          );
        } finally {
          // Unconditionally settle the UI so an abrupt close (proxy kill,
          // 9-min ceiling, mid-stream upstream error) never freezes it on
          // "thinking" with no way to recover.
          setIsThinking(false);
          setIsStreaming(false);
        }
      })();
    },
    [capability, messages]
  );

  // Persist the 'chat' conversation whenever it is idle (never mid-stream),
  // so a partial/aborted assistant message is never written to storage.
  useEffect(() => {
    if (capability !== 'chat') return;
    if (isThinking || isStreaming) return;
    saveChatMessages(messages);
  }, [capability, messages, isThinking, isStreaming]);

  return {
    messages,
    isThinking,
    isStreaming,
    error,
    send,
    abort,
    reset,
  };
}

// ── One-shot streaming (insight / summarize) ─────────────────────────────────
// Non-conversational AI surfaces (Home insight card, Profile summary, Memory
// reflection prompt) each need a single streamed passage driven by the user's
// real journal context. These reuse the same SSE parsing + dev-proxy rules as
// the conversational hook, but own their own state and never touch the chat
// history persistence.

export type OneShotCapability = 'insight' | 'summarize' | 'chat' | 'reflect' | 'memory';

/**
 * POST to /api/ai/<capability> and yield streamed text chunks as an async
 * generator. Returns early (yielding nothing) when no runtime is reachable and
 * we are NOT in dev — mirroring the rule in `send()` so a production single-file
 * build never throws on mount.
 */
export async function* streamOneShot(
  capability: OneShotCapability,
  body: object,
  { signal }: { signal?: AbortSignal } = {}
): AsyncGenerator<string> {
  const base = getApiBaseUrl();
  if (!base && !import.meta.env.DEV) return;

  // Attach the anonymous client ID (rate limiting) and the on-device personalization
  // profile to every one-shot request. The profile is small and keeps the model
  // context personal without storing anything server-side.
  const fullBody = { ...body, profile: getAIProfilePayload() };

  const response = await fetch(`${base}/api/ai/${capability}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getAnonId(),
    },
    body: JSON.stringify(fullBody),
    signal,
  });

  // 429 (rate limited) is surfaced as a friendly error and is never retried by
  // the caller — the server already throttles, so retrying would just re-429.
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error((errBody as { error?: string }).error ?? `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const parsed = parseSSELine(line);
      if (!parsed) continue;
      if (parsed.done) return;
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.text) yield parsed.text;
    }
  }
}

export interface OneShotStreamState {
  text: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Drives a single one-shot stream. Starts when `enabled` is true and aborts the
 * in-flight request on cleanup OR whenever `enabled` flips to false — so React
 * 19 StrictMode's double-invoke in dev cannot double-stream.
 */
export function useOneShotStream(
  capability: OneShotCapability,
  buildBody: () => object,
  enabled: boolean
): OneShotStreamState {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Capture the latest buildBody without making it an effect dependency, so a
  // fresh inline body (recreated every render) cannot restart/abort the stream.
  const buildBodyRef = useRef(buildBody);
  buildBodyRef.current = buildBody;

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        let acc = '';
        for await (const chunk of streamOneShot(capability, buildBodyRef.current(), {
          signal: controller.signal,
        })) {
          acc += chunk;
          setText(acc);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('[useOneShotStream]', err);
        setError('Jouspace Intelligence is unavailable. Please try again.');
      } finally {
        // Unconditionally settle the UI so an abrupt close never leaves the
        // one-shot surface stuck loading.
        setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [capability, enabled]);

  return { text, isLoading, error };
}

/**
 * Cached one-shot stream for auto-fired surfaces (Home insight, Profile summary).
 *
 * Re-mounting these screens (e.g. navigating Home↔Profile) used to re-stream on
 * every visit, burning the generative rate-limit budget and starving the user's
 * own requests. This variant caches the result keyed by capability + a hash of
 * the entries, and only re-streams when the entries change or the TTL expires.
 */
const INSIGHT_CACHE_TTL_MS = 10 * 60 * 1000;
const insightSummaryCache = new Map<string, { text: string; at: number }>();

/** Test-only: clear the client-side insight/summary cache between tests. */
export function clearInsightSummaryCache(): void {
  insightSummaryCache.clear();
}

function entriesCacheKey(entries: ClientEntry[] | undefined): string {
  if (!entries) return 'default';
  return entries.map((e) => `${e.id}:${(e.content ?? '').length}`).join('|');
}

export function useCachedOneShotStream(
  capability: OneShotCapability,
  buildBody: () => object,
  enabled: boolean,
  cacheKey: string
): OneShotStreamState {
  const cacheId = `${capability}:${cacheKey}`;
  const [state, setState] = useState<OneShotStreamState>(() => {
    const cached = insightSummaryCache.get(cacheId);
    const fresh = cached && Date.now() - cached.at < INSIGHT_CACHE_TTL_MS;
    return { text: fresh ? cached.text : '', isLoading: enabled && !fresh, error: null };
  });
  const abortRef = useRef<AbortController | null>(null);
  const buildBodyRef = useRef(buildBody);
  buildBodyRef.current = buildBody;

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    const cached = insightSummaryCache.get(cacheId);
    if (cached && Date.now() - cached.at < INSIGHT_CACHE_TTL_MS) {
      setState({ text: cached.text, isLoading: false, error: null });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    (async () => {
      try {
        let acc = '';
        for await (const chunk of streamOneShot(capability, buildBodyRef.current(), {
          signal: controller.signal,
        })) {
          acc += chunk;
          setState({ text: acc, isLoading: true, error: null });
        }
        if (acc.trim()) insightSummaryCache.set(cacheId, { text: acc, at: Date.now() });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('[useCachedOneShotStream]', err);
        setState((s) => ({ ...s, isLoading: false, error: (err as Error).message || 'Jouspace Intelligence is unavailable. Please try again.' }));
      } finally {
        if (!controller.signal.aborted) setState((s) => ({ ...s, isLoading: false }));
      }
    })();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [capability, cacheKey, enabled]);

  return state;
}

/** Live "Jouspace noticed…" insight. Defaults to the global recent entries.
 *  Cached client-side so re-mounting Home doesn't re-stream on every visit. */
export function useAiInsight(
  enabled: boolean,
  entries?: ClientEntry[]
): OneShotStreamState {
  const key = entriesCacheKey(entries ?? clientEntriesPayload());
  return useCachedOneShotStream(
    'insight',
    () => ({ entries: entries ?? clientEntriesPayload() }),
    enabled,
    key
  );
}

/** Live AI-written summary of the user's recent journal entries. Cached. */
export function useAiSummary(enabled: boolean): OneShotStreamState {
  return useCachedOneShotStream(
    'summarize',
    () => ({ entries: clientEntriesPayload() }),
    enabled,
    'all'
  );
}
