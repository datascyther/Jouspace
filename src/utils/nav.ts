/**
 * Navigation persistence: remembers the last-viewed screen/tab so a reload or
 * relaunch returns the user to where they left off (mobile-app convention).
 *
 * The stored payload is validated against the known values so a corrupt or
 * legacy value safely falls back to Home.
 */

export type Screen = 'home' | 'journal' | 'memory' | 'ai' | 'profile';
export type NavTab = 'home' | 'journal' | 'write' | 'memory' | 'ai';

import { queueUserPrefsSync } from '../lib/supabaseUserPrefs';

export interface NavState {
  screen: Screen;
  tab: NavTab;
}

const NAV_STORAGE_KEY = 'jouspace:nav';
const SCREEN_VALUES: readonly Screen[] = ['home', 'journal', 'memory', 'ai', 'profile'];
const TAB_VALUES: readonly NavTab[] = ['home', 'journal', 'write', 'memory', 'ai'];

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

/** Read the persisted nav state, falling back to Home when missing/invalid. */
export function readStoredNav(storage: ReadableStorage = localStorage): NavState {
  try {
    const raw = storage.getItem(NAV_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NavState>;
      const screen = SCREEN_VALUES.includes(parsed.screen as Screen)
        ? (parsed.screen as Screen)
        : 'home';
      const tab = TAB_VALUES.includes(parsed.tab as NavTab)
        ? (parsed.tab as NavTab)
        : 'home';
      return { screen, tab };
    }
  } catch {
    /* ignore corrupt payload */
  }
  return { screen: 'home', tab: 'home' };
}

/** Persist the current nav state (best-effort; ignores storage failures). */
export function writeStoredNav(
  state: NavState,
  storage: WritableStorage = localStorage
): void {
  try {
    storage.setItem(NAV_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore storage failure (private mode, quota, etc.) */
  }
  void queueUserPrefsSync();
}
