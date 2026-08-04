import { profileRepository } from '../../backend/repositories/ProfileRepository';
import type { UserProfile } from '@/services/auth/types';

export class OnboardingRepository {
  async saveProfile(
    uid: string,
    data: {
      displayName: string;
      primaryGoals: string[];
      initialMood: string;
      reminderPreference: string;
      notificationsEnabled: boolean;
    }
  ): Promise<void> {
    try {
      await profileRepository.update(uid, {
        display_name: data.displayName.trim(),
        onboarding_completed: true,
      });
    } catch (error) {
      console.error('Error saving onboarding profile:', error);
      throw error;
    }
  }

  async loadProfile(uid: string): Promise<Partial<UserProfile> | null> {
    if (!uid) return null;

    try {
      const row = await profileRepository.getById(uid);
      if (!row) return null;

      return {
        displayName: row.display_name || undefined,
        onboardingCompleted: row.onboarding_completed || false,
      };
    } catch (error) {
      console.error('Error loading onboarding profile:', error);
      return null;
    }
  }

  async completeOnboarding(uid: string): Promise<void> {
    try {
      await profileRepository.update(uid, {
        onboarding_completed: true,
      });
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
      throw error;
    }
  }
}

export const onboardingRepository = new OnboardingRepository();
export default onboardingRepository;
