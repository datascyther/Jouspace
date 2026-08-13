/**
 * Custom themes ("Create your own theme"): user-defined spaces with their own
 * label and title/body placeholders. Persisted globally so an entry saved with
 * a custom theme restores its placeholders when re-opened for editing.
 *
 * Storage follows the app's corrupt-safe idiom (see `readStoredNav`): a bad or
 * legacy payload safely falls back to an empty list.
 */

export interface CustomTheme {
  /** Canonical slug id, e.g. 'my_morning' — saved as the entry's theme. */
  id: string;
  /** Human display label, e.g. 'My Morning'. */
  label: string;
  placeholderTitle: string;
  placeholderBody: string;
}

const CUSTOM_THEMES_STORAGE_KEY = 'jouspace:spaces:custom';

/** Slugify a theme name to its id: lowercase, punctuation → underscores. */
export function slugifyTheme(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** True when a slug would collide with a built-in theme id or preset space id. */
export function isReservedThemeId(id: string): boolean {
  const RESERVED = new Set([
    'clarity',
    'discipline',
    'purpose',
    'pressure',
    'starting_again',
    'journal',
    'note',
    'gratitude',
    'release',
  ]);
  return RESERVED.has(id);
}

function isValidCustomTheme(value: unknown): value is CustomTheme {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<CustomTheme>;
  return (
    typeof c.id === 'string' &&
    typeof c.label === 'string' &&
    typeof c.placeholderTitle === 'string' &&
    typeof c.placeholderBody === 'string'
  );
}

/** Read persisted custom themes, or [] when absent/invalid. */
export function readCustomThemes(
  storage: Pick<Storage, 'getItem'> = localStorage
): CustomTheme[] {
  try {
    const raw = storage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCustomTheme);
  } catch {
    return [];
  }
}

/** Persist the custom themes list (best-effort; ignores storage failures). */
export function writeCustomThemes(
  themes: CustomTheme[],
  storage: Pick<Storage, 'setItem'> = localStorage
): void {
  try {
    storage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch {
    /* ignore storage failure (private mode, quota, etc.) */
  }
}

/** Upsert a custom theme into the persisted list, keyed by id. */
export function saveCustomTheme(
  theme: CustomTheme,
  storage: Storage = localStorage
): void {
  const others = readCustomThemes(storage).filter((t) => t.id !== theme.id);
  writeCustomThemes([...others, theme], storage);
}

/** Find a custom theme by id, or null when absent. */
export function findCustomThemeById(
  id: string,
  storage: Pick<Storage, 'getItem'> = localStorage
): CustomTheme | null {
  return readCustomThemes(storage).find((t) => t.id === id) ?? null;
}
