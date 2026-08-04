/**
 * useOnboarding — Onboarding business logic hook
 *
 * Orchestrates profile saving, store updates, and analytics tracking.
 * Screens never touch repositories or Firebase directly.
 */

import { useCallback } from 'react';
import { useAppStore } from '@/core/store/useAppStore';
import { onboardingRepository } from '@/repositories/OnboardingRepository';
import { analyticsService } from '@/services/analytics';
import type { OnboardingData } from '@/features/onboarding/types';

export function useOnboarding() {
  const onboardingCompleted = useAppStore(
    (state) => state.session.onboardingCompleted
  );
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);

  const finishOnboarding = useCallback(
    async (data: OnboardingData) => {
      const user = useAppStore.getState().session.user;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      try {
        // 1. Persist onboarding profile to Firestore
        await onboardingRepository.saveProfile(user.uid, {
          displayName: data.displayName.trim(),
          primaryGoals: data.primaryGoals,
          initialMood: data.initialMood,
          reminderPreference: data.reminderPreference,
          notificationsEnabled: data.notificationsEnabled,
        });

        // 2. Update local user profile in Zustand store
        await updateUserProfile({
          displayName: data.displayName.trim(),
          primaryGoals: data.primaryGoals,
          initialMood: data.initialMood,
          reminderPreference: data.reminderPreference,
          notificationsEnabled: data.notificationsEnabled,
          onboardingCompleted: true,
        });

        // 3. Mark onboarding as complete in auth service (SecureStore)
        await completeOnboarding();

        // 4. Track success analytics
        analyticsService.trackEvent('onboarding_completed', {
          goals: data.primaryGoals.join(','),
          mood: data.initialMood,
          reminder: data.reminderPreference,
          notifications: data.notificationsEnabled,
        });

        return true;
      } catch (error) {
        // Track failure analytics
        analyticsService.trackEvent('onboarding_abandoned', {
          error: String(error),
        });
        throw error;
      }
    },
    [completeOnboarding, updateUserProfile]
  );

  return {
    onboardingCompleted,
    finishOnboarding,
  };
}
