import { profileRepository as backendProfileRepo } from '../../backend/repositories/ProfileRepository';
import type { AuthUser } from '../../backend/repositories/baseRepository';
import type { UserProfile } from '@/services/auth/types';

type ProfileRow = {
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  display_name: string;
  id: string;
  is_private: boolean;
  last_login_at: string | null;
  locale: string | null;
  onboarding_completed: boolean;
  timezone: string | null;
  updated_at: string;
  username: string | null;
};

function mapRowToProfile(row: ProfileRow, uid: string): UserProfile {
  return {
    uid,
    name: row.display_name || 'User',
    email: '',
    photoURL: row.avatar_url || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : new Date(),
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en',
      tone: 'auto',
    },
    stats: {
      totalSessions: 0,
      totalMinutes: 0,
      streakDays: 0,
      lastActivityDate: new Date(),
    },
    onboardingCompleted: row.onboarding_completed || false,
    displayName: row.display_name,
  };
}

export class ProfileRepository {
  async loadProfile(user: AuthUser): Promise<UserProfile | null> {
    try {
      const row = await backendProfileRepo.getById(user.id);
      if (!row) return null;
      return mapRowToProfile(row, user.id);
    } catch {
      return null;
    }
  }

  async createProfile(user: AuthUser, name?: string): Promise<UserProfile> {
    return {
      uid: user.id,
      name: name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      photoURL: user.user_metadata?.avatar_url || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      preferences: { theme: 'dark', notifications: true, language: 'en', tone: 'auto' },
      stats: { totalSessions: 0, totalMinutes: 0, streakDays: 0, lastActivityDate: new Date() },
      onboardingCompleted: false,
    };
  }

  async updateProfile(
    uid: string,
    updates: Partial<UserProfile>,
    currentProfile: UserProfile,
  ): Promise<UserProfile> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.display_name = updates.name;
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.photoURL !== undefined) dbUpdates.avatar_url = updates.photoURL;
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
    if (updates.lastLoginAt !== undefined) dbUpdates.last_login_at = updates.lastLoginAt.toISOString();

    if (Object.keys(dbUpdates).length > 0) {
      try {
        await backendProfileRepo.update(uid, dbUpdates as any);
      } catch {
        // non-critical
      }
    }

    return { ...currentProfile, ...updates, updatedAt: new Date() };
  }

  async getProfileById(uid: string): Promise<UserProfile | null> {
    try {
      const row = await backendProfileRepo.getById(uid);
      if (!row) return null;
      return mapRowToProfile(row, uid);
    } catch {
      return null;
    }
  }
}

export const profileRepository = new ProfileRepository();
export default profileRepository;
