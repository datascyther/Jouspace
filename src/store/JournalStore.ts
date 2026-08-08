/**
 * JournalStore — the persistence abstraction.
 *
 * The rest of the app depends only on this interface, not on the concrete
 * storage backend. Today that backend is localStorage (works in the browser
 * and inside the Capacitor WebView). Later, a cloud-sync layer can be added
 * behind the same interface — callers keep calling `list/get/save/remove`
 * and receive updates via `subscribe`.
 */

import type { StoredEntry, NewEntryInput } from './types';

const STORAGE_KEY = 'jouspace:journal:v1';
const SEED_FLAG_KEY = 'jouspace:journal:seeded:v1';

/** Thrown when localStorage cannot persist (e.g. quota exceeded). */
export class StorageQuotaError extends Error {
  constructor(message = 'Storage full — recent changes may not be saved.') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export type ImportMode = 'replace' | 'merge';

/** Shape written by `exportAll()` and expected by `importEntries()`. */
export interface JournalExport {
  version: 1;
  exportedAt: string;
  entries: StoredEntry[];
}

export interface JournalStore {
  /** All entries, newest-first (by updatedAt) */
  list(): StoredEntry[];
  get(id: string): StoredEntry | undefined;
  /** Create (no id) or update (with id) an entry. Returns the stored entry. */
  save(input: NewEntryInput): StoredEntry;
  remove(id: string): boolean;
  /** Seed demo entries (used only by the Settings "Load sample data" action). */
  loadDemo(entries: StoredEntry[]): void;
  /** Return a serializable snapshot of all entries. */
  exportAll(): JournalExport;
  /** Import entries, replacing or merging with existing data. */
  importEntries(entries: StoredEntry[], mode: ImportMode): void;
  /** Be notified of any change (local writes or future remote sync). */
  subscribe(listener: () => void): () => void;
  /** Be notified of storage failures (e.g. quota exceeded). */
  subscribeError(listener: (err: StorageQuotaError) => void): () => void;
}

/**
 * localStorage-backed implementation.
 *
 * On first run (no data yet) it seeds the store with the app's default demo
 * entries so existing screens render exactly as before — after that it is a
 * fully writable, durable journal.
 */
export class LocalStorageJournalStore implements JournalStore {
  private listeners = new Set<() => void>();
  private errorListeners = new Set<(err: StorageQuotaError) => void>();
  private cache: StoredEntry[] | null = null;

  constructor(private readonly seed: StoredEntry[] = []) {
    this.ensureSeeded();
  }

  private ensureSeeded(): void {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(SEED_FLAG_KEY)) return;
    if (this.seed.length > 0 && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.seed));
    }
    // Mark as seeded even when seed is empty, so an intentionally-empty
    // first-run journal is not later overwritten by a default seed.
    localStorage.setItem(SEED_FLAG_KEY, '1');
  }

  private read(): StoredEntry[] {
    if (this.cache) return this.cache;
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.cache = raw ? (JSON.parse(raw) as StoredEntry[]) : [];
    } catch {
      this.cache = [];
    }
    return this.cache;
  }

  private write(entries: StoredEntry[]): void {
    this.cache = entries;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch (err) {
        // Surface the failure (e.g. quota exceeded) so the UI can warn the
        // user instead of silently losing data.
        this.emitError(err);
        return;
      }
    }
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  private emitError(err: unknown): void {
    const wrapped =
      err instanceof StorageQuotaError
        ? err
        : new StorageQuotaError();
    this.errorListeners.forEach((l) => l(wrapped));
    console.error('[LocalStorageJournalStore]', err);
  }

  list(): StoredEntry[] {
    return [...this.read()].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): StoredEntry | undefined {
    return this.read().find((e) => e.id === id);
  }

  save(input: NewEntryInput): StoredEntry {
    const now = Date.now();
    const existing = input.id ? this.get(input.id) : undefined;

    const entry: StoredEntry = existing
      ? { ...existing, ...input, id: existing.id, updatedAt: now }
      : {
          id:
            input.id ??
            `entry-${now}-${Math.random().toString(36).slice(2, 8)}`,
          date: input.date,
          title: input.title,
          theme: input.theme,
          content: input.content,
          createdAt: now,
          updatedAt: now,
        };

    const all = this.read();
    const idx = all.findIndex((e) => e.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    this.write(all);
    return entry;
  }

  remove(id: string): boolean {
    const all = this.read();
    const next = all.filter((e) => e.id !== id);
    if (next.length === all.length) return false;
    this.write(next);
    return true;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeError(listener: (err: StorageQuotaError) => void): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  loadDemo(entries: StoredEntry[]): void {
    const all = this.read();
    const byId = new Map(all.map((e) => [e.id, e]));
    for (const entry of entries) {
      if (!byId.has(entry.id)) all.push(entry);
    }
    this.write(all);
  }

  exportAll(): JournalExport {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: this.read(),
    };
  }

  importEntries(entries: StoredEntry[], mode: ImportMode): void {
    const valid = sanitizeImport(entries);
    if (mode === 'replace') {
      this.write(valid);
      return;
    }
    const all = this.read();
    const byId = new Map(all.map((e) => [e.id, e]));
    for (const entry of valid) {
      if (byId.has(entry.id)) continue; // merge skips duplicate ids
      all.push(entry);
    }
    this.write(all);
  }
}

/** Keep only well-formed entries that match the canonical StoredEntry shape. */
function sanitizeImport(entries: unknown): StoredEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter(
    (e): e is StoredEntry =>
      !!e &&
      typeof e === 'object' &&
      typeof (e as StoredEntry).id === 'string' &&
      typeof (e as StoredEntry).title === 'string' &&
      typeof (e as StoredEntry).theme === 'string' &&
      typeof (e as StoredEntry).content === 'string' &&
      typeof (e as StoredEntry).date === 'string' &&
      typeof (e as StoredEntry).createdAt === 'number' &&
      typeof (e as StoredEntry).updatedAt === 'number'
  );
}
