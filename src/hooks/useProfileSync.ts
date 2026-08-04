import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileRepository } from '../../backend/repositories/ProfileRepository';
import { authService } from '../../backend/services/AuthService';
import { useAppStore } from '@/core/store/useAppStore';

export function useProfileSync(uid: string | null) {
  const setUser = useAppStore((state) => state.setUser);

  const { data: profileRow } = useQuery({
    queryKey: ['profile', uid],
    queryFn: () => (uid ? profileRepository.getById(uid) : null),
    enabled: !!uid,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!profileRow) return;

    const authUser = authService.getCurrentUser();
    if (!authUser) return;

    // Merge with the user already in the store instead of replacing it. This
    // avoids clobbering guest state (e.g. onboardingCompleted = true set by the
    // welcome flow) and the user's real theme/notifications preferences, which
    // the profiles table does not store.
    const current = useAppStore.getState().session.user;
    setUser({
      uid: authUser.id,
      name: profileRow.display_name || authUser.email?.split('@')[0] || current?.name || 'User',
      email: authUser.email || '',
      photoURL: profileRow.avatar_url || current?.photoURL,
      createdAt: current?.createdAt ?? new Date(profileRow.created_at),
      updatedAt: new Date(profileRow.updated_at),
      lastLoginAt: new Date(profileRow.last_login_at || profileRow.created_at),
      preferences: {
        theme: current?.preferences?.theme ?? 'light',
        notifications: current?.preferences?.notifications ?? false,
        language: (profileRow.locale as any) || current?.preferences?.language || 'en',
        tone: current?.preferences?.tone ?? 'auto',
      },
      stats: current?.stats ?? {
        totalSessions: 0,
        totalMinutes: 0,
        streakDays: 0,
        lastActivityDate: new Date(),
      },
      onboardingCompleted:
        current?.onboardingCompleted || profileRow.onboarding_completed || false,
    });
  }, [profileRow, setUser]);
}
