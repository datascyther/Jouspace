import { useState, useCallback, useRef, useEffect } from 'react';
import { generateResponse, streamChat, probeEdgeRuntime } from '@/services/ai';
import { AIError } from '@/services/ai/types';
import type { ChatMode } from '@/services/ai/types';
import { PerfTracker } from '@/utils/chat-performance';
import { MemoryManager } from '@/services/memory';
import type { ContextEngineInput } from '@/services/memory/types';
import { chatRepository } from '@/repositories/ChatRepository';
import { saveSessionMeta, clearSessionMeta } from '@/features/chat/persistence/sessionStorage';
import { clearDraft } from '@/features/chat/persistence/draftStorage';
import type { Message } from '../types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function classifyError(error: unknown): string {
  if (error instanceof AIError) {
    if (error.statusCode === 401) {
      return 'Session expired. Please sign in again.';
    }
  if (error.statusCode === 500 || error.statusCode === 502) {
    const detail =
      error.details && typeof error.details === 'string'
        ? `: ${error.details.slice(0, 200)}`
        : '';
    return `Server error${detail}. Tap to retry.`;
  }
  if (error.statusCode === 408) {
    return 'Request timed out. Tap to retry.';
  }
  if (error.statusCode === 503) {
    const detail =
      error.details && typeof error.details === 'string'
        ? `: ${error.details.slice(0, 200)}`
        : '';
    return `Service temporarily busy${detail}. Tap to retry.`;
  }
  const statusInfo = error.statusCode ? ` (HTTP ${error.statusCode})` : '';
  return `AI request failed${statusInfo}. Tap to retry.`;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('network request failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror')
    ) {
      return 'No internet connection. Check your network and tap to retry.';
    }
    if (msg.includes('abort') || msg.includes('signal')) {
      return 'Request was cancelled.';
    }
    if (msg.includes('timeout')) {
      return 'Request timed out. Tap to retry.';
    }
    return `${error.message}. Tap to retry.`;
  }

  return 'Something went wrong. Tap to retry.';
}

const MAX_HISTORY_MESSAGES = 40;

function buildHistory(
  messages: Message[],
  memoryManager?: MemoryManager | null
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const doneMessages = messages
    .filter((m) => m.status === 'complete' && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const trimmed = doneMessages.slice(-MAX_HISTORY_MESSAGES);

  if (memoryManager) {
    return memoryManager.buildCondensedHistory(trimmed);
  }
  return trimmed;
}

export interface UseChatStreamOptions {
  uid: string | null;
  contextEngine?: ContextEngineInput;
}

export interface UseChatStreamReturn {
  messages: Message[];
  isStreaming: boolean;
  isReflecting: boolean;
  refreshing: boolean;
  sendMessage: (text: string, mode?: ChatMode) => Promise<void>;
  retryLast: () => Promise<void>;
  clearError: (id: string) => void;
  abort: () => void;
  clearConversation: () => void;
  refreshConversation: () => Promise<void>;
  conversationId: string | null;
  regenerateResponse: () => Promise<void>;
  isRestored: boolean;
  deleteMessage: (id: string) => void;
  resumeLastConversation: () => Promise<void>;
}

export function useChatStream({ uid, contextEngine }: UseChatStreamOptions): UseChatStreamReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;

  const retryingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserTextRef = useRef<string>('');
  const lastUserMessageIdRef = useRef<string>('');
  const lastModeRef = useRef<ChatMode>('standard');

  const conversationIdRef = useRef<string | null>(null);
  const memoryManagerRef = useRef<MemoryManager | null>(null);
  const isLoadedRef = useRef(false);
  const loadErrorRef = useRef<string | null>(null);

  useEffect(() => {
    setConversationId(conversationIdRef.current);
  }, []);

  // One-time probe so the device logs confirm whether the app is on the
  // server-side AI Runtime (real-time web + RAG) or the direct-NVIDIA fallback.
  useEffect(() => {
    if (uid) probeEdgeRuntime(uid);
  }, [uid]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const hydrateConversation = useCallback(async () => {
    if (!uid) return;
    try {
      const latestId = await chatRepository.loadLatestConversationId(uid);
      if (latestId) {
        const loadedMessages = await chatRepository.loadConversationMessages(uid, latestId);
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
          conversationIdRef.current = latestId;
          setConversationId(latestId);
          memoryManagerRef.current = new MemoryManager(latestId);
          setIsRestored(true);
          saveSessionMeta({
            lastConversationId: latestId,
            lastActiveAt: new Date().toISOString(),
            messageCount: loadedMessages.length,
          });
        }
      }
    } catch (error) {
      loadErrorRef.current = 'Failed to load conversation';
      console.warn('[Chat] Hydration failed:', error);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid || isLoadedRef.current) return;
    isLoadedRef.current = true;
    hydrateConversation();
  }, [uid, hydrateConversation]);

  const updateMessage = useCallback(
    (id: string, updater: (msg: Message) => Message) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
    },
    []
  );

  const summarizeConversation = useCallback(async () => {
    if (!uid || isStreamingRef.current) return;
    const currentMsgs = messagesRef.current;
    const fullHistory = currentMsgs
      .filter((m) => m.status === 'complete' && (m.role === 'user' || m.role === 'assistant'))
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    if (fullHistory.length === 0) return;

    try {
      const response = await generateResponse({
        text: 'Summarize this conversation in 2-3 sentences, focusing on key topics discussed and the user\'s emotional state.',
        uid,
        history: fullHistory,
      });
      memoryManagerRef.current?.setSummary(response.content);
    } catch (error) {
      console.warn('[Chat] Summarization failed:', error);
    }
  }, [uid]);

  const runStream = useCallback(
    async (
      text: string,
      history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
      controller: AbortController,
      mode: ChatMode,
    ): Promise<string> => {
      const assistantId = generateId();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        type: 'markdown',
        content: '',
        createdAt: new Date(),
        status: 'streaming',
      };
      setMessages((prev) => [...prev, assistantMessage]);

      let accumulated = '';
      let sources:
        | import('@/features/chat/types/Message').MessageSource[]
        | undefined;
      for await (const chunk of streamChat({
        text,
        uid: uid!,
        history,
        signal: controller.signal,
        mode,
        memoryContext: memoryManagerRef.current?.buildContext(),
      })) {
        if (chunk.citations && chunk.citations.length) sources = chunk.citations;
        if (chunk.done) break;
        if (!chunk.contentDelta) continue;
        if (accumulated.length === 0) setIsReflecting(false);
        accumulated += chunk.contentDelta;
        const snapshot = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: snapshot, status: 'streaming' } : m,
          ),
        );
      }

      const finalContent =
        accumulated || "I'm sorry, I wasn't able to generate a response. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: finalContent, status: 'complete', metadata: sources ? { sources } : m.metadata }
            : m,
        ),
      );
      return finalContent;
    },
    [uid],
  );

  const executeStream = useCallback(
    async (text: string, historyContext: Message[], mode: ChatMode = 'standard') => {
      if (!uid) {
        const errorMsg: Message = {
          id: generateId(),
          role: 'assistant',
          type: 'markdown',
          content: '',
          createdAt: new Date(),
          status: 'failed',
          metadata: { errorMessage: 'Sign in required to chat with Jouspace.' },
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      memoryManagerRef.current?.observeUserMessage(text);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60_000);

      const history = buildHistory(historyContext, memoryManagerRef.current);
      const resolvedMode: ChatMode =
        mode === 'deep' || memoryManagerRef.current?.getRecommendedMode() === 'deep'
          ? 'deep'
          : 'standard';

      setIsStreaming(true);
      setIsReflecting(true);
      console.log(`[Chat] executeStream — streaming request (mode=${resolvedMode})`);

      // Fail-safe: force isStreaming off after 90s
      const stuckTimer = setTimeout(() => {
        if (isStreamingRef.current) {
          console.warn('[Chat] Fail-safe: force-resetting stuck isStreaming');
          setIsStreaming(false);
        }
      }, 90_000);

      try {
        await runStream(text, history, controller, resolvedMode);
        clearTimeout(stuckTimer);
  } catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    const cancelledMsg: Message = {
      id: generateId(),
      role: 'assistant',
      type: 'markdown',
      content: '',
      createdAt: new Date(),
      status: 'failed',
      metadata: { errorMessage: 'Request cancelled.' },
    };
    setMessages((prev) => [...prev, cancelledMsg]);
    return;
  }

  if (error instanceof AIError && error.statusCode === 503) {
    console.warn('[Chat] AI service temporarily unavailable, retrying...', error.details);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      await runStream(text, history, controller, resolvedMode);
      clearTimeout(stuckTimer);
      return;
    } catch (retryError) {
      console.error('[Chat] AI retry failed — status:', retryError instanceof AIError ? retryError.statusCode : 'n/a', 'body:', retryError instanceof AIError ? retryError.details : retryError);
    }
  }

  if (error instanceof AIError) {
    console.error('[Chat] AI request failed — status:', error.statusCode, 'body:', error.details);
  } else {
    console.error('[Chat] AI stream error:', error);
  }

  const friendly = classifyError(error);
  const errorMsg: Message = {
          id: generateId(),
          role: 'assistant',
          type: 'markdown',
          content: '',
          createdAt: new Date(),
          status: 'failed',
          metadata: { errorMessage: friendly },
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        clearTimeout(stuckTimer);
        clearTimeout(timeoutId);
        setIsStreaming(false);
        setIsReflecting(false);
        abortRef.current = null;
      }

      if (uid && conversationIdRef.current) {
        const currentMsgs = messagesRef.current;
        const toSave = currentMsgs.filter((m) => m.status === 'complete');

        if (toSave.length > 0) {
          chatRepository
            .saveMessages(uid, toSave, conversationIdRef.current)
            .then(() => {
              memoryManagerRef.current?.incrementTurn();
              if (memoryManagerRef.current?.needsSummarization()) {
                summarizeConversation();
              }
            })
            .catch((err) => console.warn('[Chat] Firestore save failed:', err));
        }
      }
    },
    [uid, summarizeConversation]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreamingRef.current) return;

      lastUserTextRef.current = trimmed;

      if (!conversationIdRef.current) {
        const newId = generateId();
        conversationIdRef.current = newId;
        setConversationId(newId);
        memoryManagerRef.current = new MemoryManager(newId, contextEngine);
        setIsRestored(false);
        saveSessionMeta({
          lastConversationId: newId,
          lastActiveAt: new Date().toISOString(),
          messageCount: 0,
        });
      } else {
        saveSessionMeta({
          lastConversationId: conversationIdRef.current,
          lastActiveAt: new Date().toISOString(),
          messageCount: messagesRef.current.length,
        });
      }

      clearDraft(conversationIdRef.current);

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        type: 'markdown',
        content: trimmed,
        createdAt: new Date(),
        status: 'complete',
      };
      lastUserMessageIdRef.current = userMessage.id;

      const historyContext = messagesRef.current;

      const mode: ChatMode = memoryManagerRef.current?.getRecommendedMode() ?? 'standard';
      lastModeRef.current = mode;

      setMessages((prev) => [...prev, userMessage]);

      await executeStream(trimmed, historyContext, mode);
    },
    [executeStream]
  );

  const retryLast = useCallback(async () => {
    if (isStreamingRef.current || retryingRef.current || !lastUserTextRef.current) return;
    retryingRef.current = true;

    setMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.status === 'failed' && lastMsg.role === 'assistant') {
        return prev.slice(0, -1);
      }
      return prev;
    });

    const latestMessages = messagesRef.current;
    const cleanMessages = latestMessages.filter(
      (m) => !(m.status === 'failed' && m.role === 'assistant')
    );

    let lastUserIdx = -1;
    for (let i = cleanMessages.length - 1; i >= 0; i--) {
      if (cleanMessages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    const historyContext = lastUserIdx >= 0 ? cleanMessages.slice(0, lastUserIdx) : [];

    try {
      await executeStream(lastUserTextRef.current, historyContext, lastModeRef.current);
    } finally {
      retryingRef.current = false;
    }
  }, [executeStream]);

  const clearError = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setIsStreaming(false);
    lastUserTextRef.current = '';
    if (conversationIdRef.current) {
      clearDraft(conversationIdRef.current);
    }
    clearSessionMeta();
    const newId = generateId();
    conversationIdRef.current = newId;
    setConversationId(newId);
    setIsRestored(false);
    memoryManagerRef.current = new MemoryManager(newId, contextEngine);
  }, []);

  const refreshConversation = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshing(true);

    const startTime = Date.now();

    if (uid && conversationIdRef.current) {
      try {
        const loaded = await chatRepository.loadConversationMessages(uid, conversationIdRef.current);
        setMessages((prev) => {
          const merged = new Map<string, Message>();
          for (const m of prev) merged.set(m.id, m);
          for (const m of loaded) merged.set(m.id, m);
          return Array.from(merged.values());
        });
      } catch (error) {
        console.warn('[Chat] Refresh load failed:', error);
      }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < 600) {
      await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
    }

    setRefreshing(false);
    isRefreshingRef.current = false;
  }, [uid]);

  const regenerateResponse = useCallback(async () => {
    const msgs = messagesRef.current;
    const lastAssistantIdx = msgs.length - 1;

    if (lastAssistantIdx < 0 || msgs[lastAssistantIdx].role !== 'assistant') return;
    if (isStreamingRef.current) return;

    setMessages((prev) => prev.slice(0, -1));

    let lastUserText = '';
    for (let i = msgs.length - 2; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserText = msgs[i].content;
        break;
      }
    }

    if (!lastUserText) return;

    const cleanHistory = msgs.slice(0, lastAssistantIdx).filter(
      (m) => !(m.status === 'failed' && m.role === 'assistant')
    );

    await executeStream(lastUserText, cleanHistory, lastModeRef.current);
  }, [executeStream]);

  const resumeLastConversation = useCallback(async () => {
    await hydrateConversation();
  }, [hydrateConversation]);

  return {
    messages,
    isStreaming,
    isReflecting,
    refreshing,
    conversationId,
    sendMessage,
    retryLast,
    clearError,
    abort,
    clearConversation,
    refreshConversation,
    regenerateResponse,
    isRestored,
    deleteMessage,
    resumeLastConversation,
  };
}
