/**
 * supabaseProfile — cloud-backed profile (profiles table).
 *
 * Mirrors the localStorage profile (`jouspace:profile`) to Supabase so a user's
 * display name + join date follow them across devices. Reads stay synchronous
 * (from localStorage); writes are fire-and-forget upserts to the `profiles`
 * table. On sign-in the remote row is hydrated into localStorage.
 *
 * When Supabase is unconfigured this is identical to the original localStorage
 * behavior (same key, same defaults).
 */

import { SupabaseSyncStore } from './supabaseSync';

export interface Profile {
  displayName: string;
  joinedDate: string;
}

export const DEFAULT_DISPLAY_NAME = 'You';

const PROFILE_KEY = 'jouspace:profile';

function defaultJoinedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

const profileStore = new SupabaseSyncStore<Profile>(
  'profiles',
  PROFILE_KEY,
  { displayName: DEFAULT_DISPLAY_NAME, joinedDate: defaultJoinedDate() },
  {
    // The profiles table PK is `id` (== auth user id), not `user_id`.
    userIdColumn: 'id',
    onConflict: 'id',
    toRow: (p) => ({ display_name: p.displayName, joined_date: p.joinedDate }),
    fromRow: (r) => ({
      displayName: typeof r.display_name === 'string' ? r.display_name : DEFAULT_DISPLAY_NAME,
      joinedDate: typeof r.joined_date === 'string' ? r.joined_date : defaultJoinedDate(),
    }),
  },
);

export function loadProfile(): Profile {
  const p = profileStore.read();
  return {
    displayName:
      typeof p.displayName === 'string' && p.displayName.trim()
        ? p.displayName
        : DEFAULT_DISPLAY_NAME,
    joinedDate:
      typeof p.joinedDate === 'string' && p.joinedDate.trim()
        ? p.joinedDate
        : defaultJoinedDate(),
  };
}

export function saveProfile(profile: Profile): void {
  profileStore.write({
    displayName: profile.displayName,
    joinedDate: profile.joinedDate,
  });
}

/** Cloud-hydrate the profile for the current user (called on sign-in). */
export function hydrateProfile(): Promise<void> {
  return profileStore.hydrate();
}
