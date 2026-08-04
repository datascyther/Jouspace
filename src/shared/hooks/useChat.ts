/**
 * useChat — Chat Hooks
 *
 * Manages chat history (server state via TanStack Query)
 * and AI streaming (via the AI service).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatRepository } from '@/repositories/ChatRepository';
import { streamChat, messagesToParams } from '@/services/ai';
import type { ChatMessage } from '@/shared/types';

const CHAT_QUERY_KEY = ['chats'] as const;

export function useChatHistory(uid: string | null) {
  return useQuery({
    queryKey: [...CHAT_QUERY_KEY, uid],
    queryFn: async () => {
      if (!uid) return [];
      return chatRepository.loadChatHistory(uid);
    },
    enabled: !!uid,
  });
}

export function useSaveChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uid, message }: { uid: string; message: ChatMessage }) => {
      const success = await chatRepository.saveMessage(uid, message);
      if (!success) throw new Error('Failed to save chat message');
      return message;
    },
    onSuccess: (_data, { uid }) => {
      queryClient.invalidateQueries({ queryKey: [...CHAT_QUERY_KEY, uid] });
    },
  });
}

/**
 * Stream an AI response.
 * Returns an async generator that yields content chunks.
 */
export function useStreamChat() {
  return {
    stream: async function* (
      messages: Array<{ role: 'user' | 'assistant'; content: string }>,
      uid: string,
      signal?: AbortSignal
    ) {
      const aiMessages = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const params = messagesToParams(aiMessages, uid, signal);

      for await (const chunk of streamChat(params)) {
        yield chunk;
        if (chunk.done) return;
      }
    },
  };
}
