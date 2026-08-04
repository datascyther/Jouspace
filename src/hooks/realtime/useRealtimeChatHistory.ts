import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'backend/client';
import { chatRepository } from '@/repositories/ChatRepository';
import { uniqueChannelName } from './channelName';

export function useRealtimeChatHistory(uid: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['chats', uid];
  const enabled = !!uid;

  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(uniqueChannelName(`chat-history-${uid}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
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
      return chatRepository.loadChatHistory(uid);
    },
    enabled,
    staleTime: Infinity,
  });
}
