import { useState, useCallback } from 'react';

export interface Profile {
  displayName: string;
  joinedDate: string;
}

const PROFILE_KEY = 'jouspace:profile';

export const DEFAULT_DISPLAY_NAME = 'You';

function defaultJoinedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Profile>;
      return {
        displayName:
          typeof parsed.displayName === 'string' && parsed.displayName.trim()
            ? parsed.displayName
            : DEFAULT_DISPLAY_NAME,
        joinedDate:
          typeof parsed.joinedDate === 'string' && parsed.joinedDate.trim()
            ? parsed.joinedDate
            : defaultJoinedDate(),
      };
    }
  } catch {
    /* corrupt storage → fall back to defaults */
  }
  return { displayName: DEFAULT_DISPLAY_NAME, joinedDate: defaultJoinedDate() };
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
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
