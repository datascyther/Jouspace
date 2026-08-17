/**
 * Transient one-shot selection keys for the picker-style full screens.
 *
 * When the AI composer or the journal composer opens a picker as a separate
 * route, the picker cannot call back into the (now unmounted) origin screen.
 * Instead the picker writes a one-shot value here; the origin screen reads it
 * once on remount and clears it. This keeps the two screens fully decoupled
 * (each is its own route on the nav stack) while passing a result back.
 *
 * Pure, offline, corrupt-safe — mirrors the app's `utils/` idiom.
 */

const SPACE_SELECTION_KEY = 'jouspace:space:selection';
const AI_ATTACH_KEY = 'jouspace:ai:attach';

export interface SpaceSelection {
  spaceId: string;
  /** id of an active custom theme, or null for a preset space. */
  customThemeId: string | null;
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore corrupt payload */
  }
  return null;
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore storage failure (private mode, quota, etc.) */
  }
}

function clearKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── Space selection (journal → SpacePickerScreen) ────────────────────────────

export function writeSpaceSelection(sel: SpaceSelection): void {
  writeJSON(SPACE_SELECTION_KEY, sel);
}

export function readSpaceSelection(): SpaceSelection | null {
  return readJSON<SpaceSelection>(SPACE_SELECTION_KEY);
}

export function clearSpaceSelection(): void {
  clearKey(SPACE_SELECTION_KEY);
}

// ── AI attach (AI composer → EntryPickerScreen) ──────────────────────────────

export function writeAiAttach(title: string): void {
  writeJSON(AI_ATTACH_KEY, { title });
}

export function readAiAttach(): string | null {
  return readJSON<{ title: string }>(AI_ATTACH_KEY)?.title ?? null;
}

export function clearAiAttach(): void {
  clearKey(AI_ATTACH_KEY);
}
