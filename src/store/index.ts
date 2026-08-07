/**
 * Store barrel + singleton instance.
 *
 * The app imports `journalStore` from here. Seeded from the default demo
 * entries on first run; afterwards it is a real, durable on-device journal.
 * Swap the implementation (SQLite, cloud-backed, etc.) without touching
 * any caller.
 */

import { LocalStorageJournalStore } from './JournalStore';
import { DEFAULT_RECENT_ENTRIES } from '../mockData';
import type { StoredEntry } from './types';

function seedFromDemo(): StoredEntry[] {
  const now = Date.now();
  // Spread the demo entries over the past few days (newest first already).
  return DEFAULT_RECENT_ENTRIES.map((e, i) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    theme: e.theme,
    content: e.content ?? '',
    createdAt: now - (i + 1) * 86_400_000,
    updatedAt: now - (i + 1) * 86_400_000,
  }));
}

export const journalStore = new LocalStorageJournalStore(seedFromDemo());

// ── Re-exports ────────────────────────────────────────────────────────────────
export { LocalStorageJournalStore } from './JournalStore';
export type { JournalStore } from './JournalStore';
export type { StoredEntry, NewEntryInput } from './types';
export { dateLabel } from './types';
