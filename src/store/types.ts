/**
 * Journal domain types for the persistence layer.
 *
 * `StoredEntry` is the canonical on-device shape. It is structurally
 * compatible with the UI's `Entry` type (id/date/title/theme/content), so all
 * existing screens keep working without changes, while the extra metadata
 * (createdAt/updatedAt) powers sorting, dedupe, and future cloud sync.
 */

export interface StoredEntry {
  id: string;
  /** Human display label, e.g. "Aug 6" */
  date: string;
  title: string;
  /** Free-form theme label shown as a chip, e.g. "clarity" */
  theme: string;
  content: string;
  /** Epoch ms — set on first save */
  createdAt: number;
  /** Epoch ms — bumped on every update */
  updatedAt: number;
}

/** Input for creating or updating an entry. Omit `id` to create a new one. */
export type NewEntryInput = {
  date: string;
  title: string;
  theme: string;
  content: string;
  id?: string;
};

/** Derive a short display label like "Aug 6" from a Date. */
export function dateLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
