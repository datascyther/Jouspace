import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'backend/client';
import { conversationRepository } from '@/repositories/ConversationRepository';
import { uniqueChannelName } from './channelName';

export function useRealtimeConversationDetails(conversationId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['conversationDetail', conversationId];
  const enabled = !!conversationId;

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(uniqueChannelName(`conversation-detail-${conversationId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!conversationId) return null;
      return conversationRepository.getConversation(conversationId);
    },
    enabled,
    staleTime: Infinity,
  });
}
