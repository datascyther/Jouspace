import { useMemo } from 'react';
import { useAppStore } from '@/core/store/useAppStore';
import { useChatStream } from '../hooks/useChatStream';
import { useSessionContext } from '../hooks/useSessionContext';
import type { ContextEngineInput } from '@/services/memory/types';
import type { Message } from '../types/Message';
import type { ConversationState, ConversationStatus } from './ConversationState';
import type { ConversationController } from './ConversationController';

function deriveStatus(messages: Message[], isStreaming: boolean): ConversationStatus {
  if (isStreaming) return 'streaming';
  if (messages.length === 0) return 'idle';
  const last = messages[messages.length - 1];
  if (last.status === 'failed') return 'error';
  if (last.role === 'user' && last.status === 'complete') return 'sending';
  if (last.status === 'sending') return 'sending';
  return 'complete';
}

export function useConversation(): { state: ConversationState; controller: ConversationController; isRestored: boolean } {
  const uid = useAppStore((state) => state.session.user?.uid ?? null);
  const userName = useAppStore((state) => state.session.user?.name);
  const sessionCtx = useSessionContext();

  const contextEngine: ContextEngineInput = useMemo(() => ({
    userName: userName,
    initialMood: sessionCtx.mood ?? undefined,
    currentJourney: sessionCtx.previousSessionFocus ?? undefined,
    sessionCount: sessionCtx.sessionCount,
  }), [userName, sessionCtx.mood, sessionCtx.previousSessionFocus, sessionCtx.sessionCount]);

  const {
    messages,
    isStreaming,
    isReflecting,
    conversationId,
    sendMessage,
    retryLast,
    regenerateResponse,
    abort,
    clearConversation,
    refreshConversation,
    clearError,
    deleteMessage,
    isRestored,
    resumeLastConversation,
  } = useChatStream({ uid, contextEngine });

  const status = deriveStatus(messages, isStreaming);
  const lastMessage = messages[messages.length - 1];
  const errorMessage = lastMessage?.status === 'failed' ? lastMessage.metadata?.errorMessage : undefined;

  const state: ConversationState = useMemo(() => ({
    conversationId: conversationId ?? null,
    messages,
    status,
    isReflecting,
    error: errorMessage,
  }), [messages, status, errorMessage, conversationId, isReflecting]);

  const controller: ConversationController = useMemo(() => ({
    sendMessage,
    retry: retryLast,
    regenerate: regenerateResponse,
    abort,
    clear: clearConversation,
    refresh: refreshConversation,
    dismissMessage: (id: string) => clearError(id),
    deleteMessage,
    resumeLastConversation,
  }), [sendMessage, retryLast, regenerateResponse, abort, clearConversation, refreshConversation, clearError, deleteMessage, resumeLastConversation]);

  return { state, controller, isRestored };
}
