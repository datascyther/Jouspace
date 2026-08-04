import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'backend/client';
import { profileRepository } from '../../../backend/repositories/ProfileRepository';
import { uniqueChannelName } from './channelName';
import type { UserProfile } from '@/services/auth/types';

export function useRealtimeProfile(uid: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['profile', uid];
  const enabled = !!uid;

  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(uniqueChannelName(`profile-changes-${uid}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${uid}`,
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
      const row = await profileRepository.getById(uid);
      if (!row) return null;
      return {
        uid: row.id,
        name: row.display_name || 'User',
        email: '',
        photoURL: row.avatar_url || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : new Date(),
        preferences: { theme: 'dark' as const, notifications: true, language: 'en' as const, tone: 'auto' as const },
        stats: { totalSessions: 0, totalMinutes: 0, streakDays: 0, lastActivityDate: new Date() },
        onboardingCompleted: row.onboarding_completed || false,
        displayName: row.display_name,
      } as UserProfile;
    },
    enabled,
    staleTime: Infinity,
  });
}
