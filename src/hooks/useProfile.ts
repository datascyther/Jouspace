import { useState, useCallback } from 'react';
import {
  loadProfile as loadProfileCloud,
  saveProfile as saveProfileCloud,
  hydrateProfile as hydrateProfileCloud,
  type Profile,
  DEFAULT_DISPLAY_NAME,
} from '../lib/supabaseProfile';

export type { Profile };
export { DEFAULT_DISPLAY_NAME };

export function loadProfile(): Profile {
  return loadProfileCloud();
}

export function saveProfile(profile: Profile): void {
  saveProfileCloud(profile);
}

/** Cloud-hydrate the profile for the current user (called on sign-in). */
export function hydrateProfile(): Promise<void> {
  return hydrateProfileCloud();
}

/** Derive up-to-2-char initials from a display name. */
export function deriveInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return DEFAULT_DISPLAY_NAME[0].toUpperCase();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export function useProfile(): {
  profile: Profile;
  setDisplayName: (name: string) => void;
} {
  const [profile, setProfile] = useState<Profile>(loadProfile);

  const setDisplayName = useCallback((name: string) => {
    setProfile((prev) => {
      const next: Profile = { ...prev, displayName: name };
      saveProfile(next);
      return next;
    });
  }, []);

  return { profile, setDisplayName };
}
