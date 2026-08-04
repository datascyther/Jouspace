import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'backend/client';
import { messageRepository, MESSAGES_PAGE_SIZE } from '@/repositories/MessageRepository';
import { uniqueChannelName } from './channelName';
import type { ConversationMessage } from '@/shared/types';

function messagesQueryKey(conversationId: string | null): string[] {
  return ['groupMessages', conversationId];
}

export function useRealtimeGroupMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const key = messagesQueryKey(conversationId);
  const enabled = !!conversationId;

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(uniqueChannelName(`group-messages-${conversationId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: key });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const loadOlderMessages = useCallback(async (): Promise<number> => {
    if (!conversationId) return 0;

    const cached = queryClient.getQueryData<ConversationMessage[]>(key);
    if (!cached || cached.length === 0) return 0;

    const lastMessage = cached[cached.length - 1];

    const olderMessages = await messageRepository.getMessages(
      conversationId,
      MESSAGES_PAGE_SIZE,
      lastMessage,
    );

    if (olderMessages.length > 0) {
      queryClient.setQueryData<ConversationMessage[]>(key, (existing = []) => [
        ...existing,
        ...olderMessages,
      ]);
    }

    return olderMessages.length;
  }, [conversationId, queryClient, key]);

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!conversationId) return [];
      return messageRepository.getMessages(conversationId);
    },
    enabled,
    staleTime: Infinity,
    select: (data: ConversationMessage[]) => [...data].reverse(),
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    loadOlderMessages,
    hasMore: (query.data ?? []).length >= MESSAGES_PAGE_SIZE,
  };
}
