/**
 * Draft persistence: an unsaved new entry (title/body/theme) survives a reload
 * or accidental navigation so an in-progress thought is never lost. The draft
 * is cleared once the entry is saved.
 *
 * Editing an existing entry intentionally does NOT touch the draft — the draft
 * only represents a brand-new entry being written.
 */

export interface Draft {
  title: string;
  body: string;
  theme: string;
  /** Selected Space id ('journal' | 'note' | 'gratitude' | 'release' | 'custom'). */
  spaceId?: string;
  /** Custom theme id when a "Create your own theme" space is active. */
  customThemeId?: string;
  savedAt: number;
}

import { queueUserPrefsSync } from '../lib/supabaseUserPrefs';

const DRAFT_STORAGE_KEY = 'jouspace:journal:draft';

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;
type RemovableStorage = Pick<Storage, 'removeItem'>;

/** Read the persisted draft, or null when absent/invalid. */
export function readDraft(storage: ReadableStorage = localStorage): Draft | null {
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (
      typeof parsed.title === 'string' &&
      typeof parsed.body === 'string' &&
      typeof parsed.theme === 'string'
    ) {
      return {
        title: parsed.title,
        body: parsed.body,
        theme: parsed.theme,
        spaceId: typeof parsed.spaceId === 'string' ? parsed.spaceId : undefined,
        customThemeId:
          typeof parsed.customThemeId === 'string'
            ? parsed.customThemeId
            : undefined,
        savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Persist the draft (best-effort; ignores storage failures). */
export function writeDraft(
  draft: Draft,
  storage: WritableStorage = localStorage
): void {
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore storage failure (private mode, quota, etc.) */
  }
  void queueUserPrefsSync();
}

/** Remove the persisted draft (called after the entry is saved). */
export function clearDraft(storage: RemovableStorage = localStorage): void {
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* ignore storage failure */
  }
  void queueUserPrefsSync();
}
