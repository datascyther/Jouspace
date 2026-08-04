import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'backend/client';
import { conversationRepository } from '@/repositories/ConversationRepository';
import { uniqueChannelName } from './channelName';
import { useAppStore } from '@/core/store/useAppStore';

export function useUnreadCount(): number {
  const uid = useAppStore((state) => state.session.user?.uid ?? null);
  const queryClient = useQueryClient();
  const queryKey = ['userConversations', uid];

  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(uniqueChannelName(`unread-count-${uid}`))
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

  const { data: conversations } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!uid) return [];
      return conversationRepository.getUserConversations(uid);
    },
    enabled: !!uid,
    staleTime: Infinity,
  });

  if (!conversations || conversations.length === 0) return 0;

  const now = Date.now();
  return conversations.filter((uc) => {
    const lastRead = uc.lastReadAt?.getTime?.() ?? 0;
    const lastMsgAt = uc.lastMessageAt?.getTime?.() ?? 0;
    return lastMsgAt > lastRead && !uc.isMuted;
  }).length;
}
