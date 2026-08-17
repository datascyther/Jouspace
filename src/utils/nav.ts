/**
 * Navigation persistence: remembers the last-viewed screen/tab so a reload or
 * relaunch returns the user to where they left off (mobile-app convention).
 *
 * The stored payload is validated against the known values so a corrupt or
 * legacy value safely falls back to Home.
 */

export type Screen =
  | 'home'
  | 'journal'
  | 'memory'
  | 'ai'
  | 'profile'
  // Profile sub-screens (previously sheets/overlays → now full screens)
  | 'notifications'
  | 'notificationSettings'
  | 'appearance'
  | 'privacy'
  | 'help'
  | 'feedback'
  | 'about'
  | 'editProfile'
  // Memory sub-screens
  | 'search'
  | 'memoryThread'
  // AI sub-screens
  | 'aiContext'
  | 'aiHistory'
  | 'aiReflect'
  | 'entryPicker'
  // Entry / composer sub-screens
  | 'entryDetail'
  | 'spacePicker';

export type NavTab = 'home' | 'journal' | 'write' | 'memory' | 'ai';

/**
 * A nav node carries the active screen plus the bottom-nav tab that should stay
 * highlighted while it (and any screens pushed on top of it) is visible. The
 * navigation stack is an array of these; the last entry is the current screen.
 */
export interface NavNode {
  screen: Screen;
  tab: NavTab;
}

export interface NavState {
  screen: Screen;
  tab: NavTab;
}

/** Screens that anchor the bottom navigation (each maps to one tab). */
const TAB_ROOTS: ReadonlySet<Screen> = new Set<Screen>([
  'home',
  'journal',
  'memory',
  'ai',
  'profile',
]);

export function isTabRoot(screen: Screen): boolean {
  return TAB_ROOTS.has(screen);
}

/** Map a bottom-nav tab to the root screen + tab node that should be shown. */
export function tabToNode(tab: NavTab): NavNode {
  switch (tab) {
    case 'home':
      return { screen: 'home', tab: 'home' };
    case 'journal':
      return { screen: 'journal', tab: 'journal' };
    case 'write':
      return { screen: 'journal', tab: 'write' };
    case 'memory':
      return { screen: 'memory', tab: 'memory' };
    case 'ai':
      return { screen: 'ai', tab: 'ai' };
  }
}

const NAV_STORAGE_KEY = 'jouspace:nav';
const SCREEN_VALUES: readonly Screen[] = [
  'home',
  'journal',
  'memory',
  'ai',
  'profile',
  'notifications',
  'notificationSettings',
  'appearance',
  'privacy',
  'help',
  'feedback',
  'about',
  'search',
  'memoryThread',
  'aiContext',
  'aiHistory',
  'aiReflect',
  'entryPicker',
  'entryDetail',
  'spacePicker',
];
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
}
