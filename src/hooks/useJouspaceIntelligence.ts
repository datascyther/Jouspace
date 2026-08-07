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
 *   in AIScreenContent and AIReflectDrawer
 * - Supports abort (user can cancel mid-stream)
 *
 * The frontend never sees the model, the API key, or provider details.
 * It only sees: messages, send(), isThinking, isStreaming, abort(), error.
 */

import { useState, useRef, useCallback } from 'react';
import { journalStore } from '../store';

// ── Runtime endpoint ──────────────────────────────────────────────────────────
// The Intelligence Runtime base URL. In dev it is empty (same-origin; the Vite
// proxy forwards /api → localhost:3001). For a deployed APK/PWA, set
// VITE_API_BASE_URL=https://your-runtime-host during the build so requests go
// to a real remote backend instead of the device's own origin.
const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)
    ?.replace(/\/+$/, '') ?? '';

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

// ── SSE parsing ───────────────────────────────────────────────────────────────

function parseSSELine(line: string): { text?: string; error?: string; done?: boolean } | null {
  if (!line.startsWith('data: ')) return null;
  const payload = line.slice(6).trim();
  if (payload === '[DONE]') return { done: true };
  try {
    return JSON.parse(payload) as { text?: string; error?: string };
  } catch {
    return null;
  }
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
    setMessages(initialMessages);
    setError(null);
  }, [abort, initialMessages]);

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
            };

      // Placeholder assistant message — text will be streamed in
      const assistantId = `a-${Date.now()}`;
      let firstChunk = true;

      (async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/ai/${capability}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(
              (errBody as { error?: string }).error ?? `HTTP ${response.status}`
            );
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response stream');

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines
            const lines = buffer.split('\n');
            // Keep the last (possibly incomplete) line in the buffer
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const parsed = parseSSELine(line);
              if (!parsed) continue;

              if (parsed.done) {
                setIsStreaming(false);
                return;
              }

              if (parsed.error) {
                setError(parsed.error);
                setIsThinking(false);
                setIsStreaming(false);
                return;
              }

              if (parsed.text) {
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
                      text: parsed.text ?? '',
                    },
                  ]);
                } else {
                  // Accumulate subsequent tokens into the assistant message
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, text: m.text + (parsed.text ?? '') }
                        : m
                    )
                  );
                }
              }
            }
          }
        } catch (err) {
          if ((err as Error).name === 'AbortError') return; // User cancelled
          console.error('[useJouspaceIntelligence]', err);
          setError('Jouspace Intelligence is unavailable. Please try again.');
          setIsThinking(false);
          setIsStreaming(false);
        }
      })();
    },
    [capability, messages]
  );

  return { messages, isThinking, isStreaming, error, send, abort, reset };
}
