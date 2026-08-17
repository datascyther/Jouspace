import { useState, useCallback, useEffect } from 'react';

export interface Profile {
  displayName: string;
  joinedDate: string;
  updatedAt?: number;
}

export const DEFAULT_DISPLAY_NAME = 'You';

const PROFILE_KEY = 'jouspace:profile';

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
      const p = JSON.parse(raw) as Partial<Profile>;
      return {
        displayName:
          typeof p.displayName === 'string' && p.displayName.trim()
            ? p.displayName
            : DEFAULT_DISPLAY_NAME,
        joinedDate:
          typeof p.joinedDate === 'string' && p.joinedDate.trim()
            ? p.joinedDate
            : defaultJoinedDate(),
        updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
      };
    }
  } catch {
    /* corrupt payload → fall back to defaults */
  }
  return { displayName: DEFAULT_DISPLAY_NAME, joinedDate: defaultJoinedDate(), updatedAt: 0 };
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    // Notify cloudSync that profile changed locally.
    window.dispatchEvent(new CustomEvent('jouspace:profile:local-changed'));
  } catch {
    /* storage failure — non-fatal */
  }
}

/** No-op: local-first has nothing to hydrate from. */
export function hydrateProfile(): Promise<void> {
  return Promise.resolve();
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
      const next: Profile = { ...prev, displayName: name, updatedAt: Date.now() };
      saveProfile(next);
      return next;
    });
  }, []);

  // Re-read from localStorage when cloud sync pushes a remote update.
  useEffect(() => {
    const handleRemote = () => setProfile(loadProfile());
    window.addEventListener('jouspace:profile:remote-changed', handleRemote);
    return () => window.removeEventListener('jouspace:profile:remote-changed', handleRemote);
  }, []);

  return { profile, setDisplayName };
}
