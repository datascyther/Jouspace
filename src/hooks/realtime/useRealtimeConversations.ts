import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'backend/client';
import { conversationRepository } from '@/repositories/ConversationRepository';
import { uniqueChannelName } from './channelName';

export function useRealtimeConversations(uid: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['conversations', uid];
  const enabled = !!uid;

  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(uniqueChannelName(`conversations-${uid}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_conversations',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!uid) return [];
      return conversationRepository.getUserConversations(uid);
    },
    enabled,
    staleTime: Infinity,
  });
}
