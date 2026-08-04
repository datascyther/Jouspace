import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'backend/client';
import { userPreferencesService } from '../../../backend/services/UserPreferencesService';
import { uniqueChannelName } from './channelName';
import type { UserPreferences } from '@/shared/types';

export function useRealtimePreferences(uid: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['userPreferences', uid];
  const enabled = !!uid;

  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(uniqueChannelName(`preferences-changes-${uid}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
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
      if (!uid) return null;
      try {
        return await userPreferencesService.get() as unknown as UserPreferences;
      } catch {
        return null;
      }
    },
    enabled,
    staleTime: Infinity,
  });
}
