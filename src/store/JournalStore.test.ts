import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageJournalStore, StorageQuotaError } from './JournalStore';
import type { StoredEntry } from './types';

function makeEntry(id: string, theme = 'clarity'): StoredEntry {
  return {
    id,
    date: 'Aug 1',
    title: `Entry ${id}`,
    theme,
    content: 'Some content',
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('LocalStorageJournalStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty on first run (no auto-seed)', () => {
    const store = new LocalStorageJournalStore();
    expect(store.list()).toEqual([]);
    // SEED_FLAG is written so an empty first run is never overwritten.
    expect(localStorage.getItem('jouspace:journal:seeded:v1')).toBe('1');
  });

  it('persists and lists entries', () => {
    const store = new LocalStorageJournalStore();
    store.save(makeEntry('a'));
    store.save(makeEntry('b'));
    const ids = store.list().map((e) => e.id);
    expect(ids).toHaveLength(2);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('updates an existing entry when id is reused', () => {
    const store = new LocalStorageJournalStore();
    const created = store.save(makeEntry('a'));
    const updated = store.save({
      id: created.id,
      date: 'Aug 2',
      title: 'Edited',
      theme: 'purpose',
      content: 'new',
    });
    expect(updated.title).toBe('Edited');
    expect(store.list()).toHaveLength(1);
  });

  it('removes an entry', () => {
    const store = new LocalStorageJournalStore();
    const created = store.save(makeEntry('a'));
    expect(store.remove(created.id)).toBe(true);
    expect(store.list()).toHaveLength(0);
  });

  it('exportAll / importEntries round-trips (merge skips duplicate ids)', () => {
    const store = new LocalStorageJournalStore();
    store.save(makeEntry('a'));
    const exported = store.exportAll();
    expect(exported.version).toBe(1);
    expect(exported.entries).toHaveLength(1);

    const other = new LocalStorageJournalStore();
    other.importEntries(exported.entries, 'merge');
    other.importEntries([makeEntry('a'), makeEntry('b')], 'merge');
    expect(other.list().map((e) => e.id).sort()).toEqual(['a', 'b']);

    const replace = new LocalStorageJournalStore();
    replace.importEntries([makeEntry('z')], 'replace');
    expect(replace.list().map((e) => e.id)).toEqual(['z']);
  });

  it('rejects malformed import entries', () => {
    const good: StoredEntry = {
      id: 'b',
      date: 'Aug 2',
      title: 'B',
      theme: 'c',
      content: '',
      createdAt: 0,
      updatedAt: 0,
    };
    const store = new LocalStorageJournalStore();
    // An object missing required fields must be dropped by sanitizeImport.
    store.importEntries(
      [{ id: 'x' } as unknown as StoredEntry, good],
      'replace'
    );
    expect(store.list().map((e) => e.id)).toEqual(['b']);
  });

  it('surfaces storage quota failures via subscribeError', () => {
    const store = new LocalStorageJournalStore();
    const errors: StorageQuotaError[] = [];
    store.subscribeError((e) => errors.push(e));

    const ls = globalThis.localStorage as {
      setItem: (k: string, v: string) => void;
    };
    const spy = vi
      .spyOn(ls, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });
    store.save(makeEntry('a'));
    spy.mockRestore();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(StorageQuotaError);
  });

  it('notifies subscribers on change', () => {
    const store = new LocalStorageJournalStore();
    let calls = 0;
    const unsub = store.subscribe(() => {
      calls += 1;
    });
    store.save(makeEntry('a'));
    expect(calls).toBe(1);
    unsub();
    store.save(makeEntry('b'));
    expect(calls).toBe(1);
  });
});
