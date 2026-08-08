/**
 * Store barrel + singleton instance.
 *
 * The app imports `journalStore` from here. On first run it starts EMPTY (no
 * fabricated demo entries) so new users get a clean, honest journal. Demo data
 * lives in `mockData` and is only injected on demand via `loadDemoData()`
 * (Settings → "Load sample data"). Swap the implementation (SQLite, cloud-
 * backed, etc.) without touching any caller.
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

// No seed by default — an empty first run is the intended v1 experience.
export const journalStore = new LocalStorageJournalStore();

/** Inject the bundled sample entries (Settings → "Load sample data"). */
export function loadDemoData(): void {
  journalStore.loadDemo(seedFromDemo());
}

/** Serialize the journal and trigger a browser download of the JSON file. */
export function downloadJournalExport(): void {
  const data = journalStore.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jouspace-journal-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Re-exports ────────────────────────────────────────────────────────────────
export { LocalStorageJournalStore, StorageQuotaError } from './JournalStore';
export type { JournalStore, JournalExport, ImportMode } from './JournalStore';
export type { StoredEntry, NewEntryInput } from './types';
export { dateLabel } from './types';
