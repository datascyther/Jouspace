/**
 * supabaseHydrate — central entry point to hydrate every cloud-backed user store
 * from Supabase on sign-in (and on app start after a persisted session).
 *
 * The `profiles` and `personalization` stores auto-hydrate via their own
 * `onAuthStateChange` listeners (see supabaseSync.ts). This module drives the
 * remaining standalone stores (custom themes, chat history, AI context, user
 * prefs) so a fresh device / reinstall picks up the user's real data.
 */

import { hydrateProfile } from './supabaseProfile';
import { hydrateCustomThemes } from './supabaseCustomThemes';
import { hydrateChatHistory } from './supabaseChatHistory';
import { hydrateAiContext } from './supabaseAiContext';
import { hydrateUserPrefs } from './supabaseUserPrefs';

/** Pull every user-scoped cloud row into the local (localStorage) mirrors. */
export async function hydrateAllUserSync(): Promise<void> {
  await Promise.allSettled([
    hydrateProfile(),
    hydrateCustomThemes(),
    hydrateChatHistory(),
    hydrateAiContext(),
    hydrateUserPrefs(),
  ]);
}
