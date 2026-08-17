/**
 * cloudSync.test.ts — Tests for the Firestore ↔ localStorage sync engine.
 *
 * All tests mock firebase/firestore and ../lib/firestore to avoid real
 * Firestore connections. Tests run against the in-memory localStorage mock
 * provided by src/test/setup.ts.
 *
 * IMPORTANT: We use vi.resetModules() + dynamic imports in each test so that
 * the journalStore singleton (with its private cache) is fresh per test.
 * Tests write entries directly to localStorage (bypassing save()'s Date.now()
 * override on updatedAt) to control merge timestamps precisely.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { StoredEntry } from './types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(
  id: string,
  overrides: Partial<StoredEntry> = {},
): StoredEntry {
  return {
    id,
    date: 'Aug 1',
    title: `Entry ${id}`,
    theme: 'clarity',
    content: `Content for ${id}`,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

/** Write entries directly to localStorage (bypasses save()'s Date.now()). */
function seedLocalEntries(entries: StoredEntry[]): void {
  localStorage.setItem('jouspace:journal:v1', JSON.stringify(entries));
  localStorage.setItem('jouspace:journal:seeded:v1', '1');
}

// ── Mock Firestore (vi.hoisted so mock factories can access them) ────────────

const {
  mockDb,
  mockSetDocCalls,
  mockSnapshotCallbacks,
  getMockGetDocsData,
  setMockGetDocsData,
  resetMockFirestore,
} = vi.hoisted(() => {
  const db: Record<string, Record<string, unknown>> = {};
  const setDocCalls: Array<{ path: string; data: Record<string, unknown> }> = [];
  const snapshotCallbacks: Array<(snapshot: any) => void> = [];
  let getDocsData: Record<string, Record<string, unknown>> = {};

  return {
    mockDb: db,
    mockSetDocCalls: setDocCalls,
    mockSnapshotCallbacks: snapshotCallbacks,
    getMockGetDocsData: () => getDocsData,
    setMockGetDocsData: (d: Record<string, unknown>) => {
      getDocsData = d as Record<string, Record<string, unknown>>;
    },
    resetMockFirestore: () => {
      Object.keys(db).forEach((k) => delete db[k]);
      setDocCalls.length = 0;
      snapshotCallbacks.length = 0;
      getDocsData = {};
    },
  };
});

vi.mock('../lib/firestore', () => ({
  getFirestoreDB: vi.fn(() => ({ projectId: 'mock' })),
  isFirestoreReady: vi.fn(() => true),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, ...segments: string[]) => ({
    _type: 'collection',
    _path: segments.join('/'),
  })),
  doc: vi.fn((...args: unknown[]) => {
    // doc(collectionRef, id) or doc(db, ...path)
    if (args.length === 2 && typeof args[1] === 'string') {
      const col = args[0] as { _path?: string };
      return { _type: 'doc', _path: `${col._path}/${args[1]}` };
    }
    if (args.length >= 3) {
      return { _type: 'doc', _path: args.slice(1).join('/') };
    }
    return { _type: 'doc', _path: 'unknown' };
  }),
  getDoc: vi.fn(async (ref: { _path: string }) => {
    const data = mockDb[ref._path];
    return {
      exists: () => !!data,
      data: () => data ?? null,
      id: ref._path.split('/').pop(),
    };
  }),
  getDocs: vi.fn(async () => {
    const data = getMockGetDocsData();
    return {
      docs: Object.entries(data).map(([path, docData]) => ({
        id: path.split('/').pop()!,
        ref: { _path: path },
        data: () => docData,
      })),
    };
  }),
  setDoc: vi.fn(async (ref: { _path: string }, data: Record<string, unknown>) => {
    mockDb[ref._path] = data;
    mockSetDocCalls.push({ path: ref._path, data });
  }),
  writeBatch: vi.fn(() => {
    const deletes: string[] = [];
    return {
      delete: vi.fn((ref: { _path: string }) => {
        deletes.push(ref._path);
      }),
      commit: vi.fn(async () => {
        for (const path of deletes) {
          delete mockDb[path];
        }
      }),
    };
  }),
  onSnapshot: vi.fn(
    (_ref: unknown, callback: (snapshot: any) => void) => {
      mockSnapshotCallbacks.push(callback);
      // Don't fire callback immediately — real Firestore fires asynchronously.
      return vi.fn(); // unsubscribe
    },
  ),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('cloudSync', () => {
  beforeEach(() => {
    vi.resetModules(); // Fresh module instances per test (clears singleton caches).
    localStorage.clear();
    resetMockFirestore();
    setMockGetDocsData({});
    vi.clearAllMocks();
  });

  describe('initial merge', () => {
    it('pulls cloud entries into empty local store', async () => {
      // Pre-populate mock Firestore with cloud entries.
      seedLocalEntries([]); // Ensure seeded flag is set.
      setMockGetDocsData({
        'users/test-uid/entries/cloud-1': makeEntry('cloud-1', { updatedAt: 2000 }),
      });

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const { journalStore } = await import('./index');
      const entries = journalStore.list();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('cloud-1');
      expect(entries[0].title).toBe('Entry cloud-1');
    });

    it('merges by ID with LWW (cloud wins when newer)', async () => {
      // Set up local entry with older timestamp (directly in localStorage).
      seedLocalEntries([
        makeEntry('shared-1', { title: 'Local version', updatedAt: 1000 }),
      ]);

      // Cloud has the same ID with newer timestamp.
      setMockGetDocsData({
        'users/test-uid/entries/shared-1': makeEntry('shared-1', {
          title: 'Cloud version',
          updatedAt: 5000,
        }),
      });

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const { journalStore } = await import('./index');
      const entries = journalStore.list();
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Cloud version');
    });

    it('merges by ID with LWW (local wins when newer)', async () => {
      // Local entry with newer timestamp.
      seedLocalEntries([
        makeEntry('shared-1', { title: 'Local version', updatedAt: 5000 }),
      ]);

      // Cloud has older timestamp.
      setMockGetDocsData({
        'users/test-uid/entries/shared-1': makeEntry('shared-1', {
          title: 'Cloud version',
          updatedAt: 1000,
        }),
      });

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const { journalStore } = await import('./index');
      const entries = journalStore.list();
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Local version');
    });

    it('preserves local-only entries (pushes them to cloud)', async () => {
      seedLocalEntries([
        makeEntry('local-1', { updatedAt: 1000 }),
      ]);

      // No cloud entries.
      setMockGetDocsData({});

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const { journalStore } = await import('./index');
      const entries = journalStore.list();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('local-1');

      // Should have been pushed to cloud via setDoc.
      const pushCall = mockSetDocCalls.find(
        (c) => c.path === 'users/test-uid/entries/local-1',
      );
      expect(pushCall).toBeDefined();
    });

    it('handles mixed local and cloud entries', async () => {
      seedLocalEntries([
        makeEntry('local-a', { title: 'A local', updatedAt: 1000 }),
        makeEntry('local-b', { title: 'B local', updatedAt: 5000 }),
      ]);

      // Cloud: entries B (older) and C (new).
      setMockGetDocsData({
        'users/test-uid/entries/local-b': makeEntry('local-b', {
          title: 'B cloud',
          updatedAt: 2000, // older than local
        }),
        'users/test-uid/entries/cloud-c': makeEntry('cloud-c', {
          title: 'C cloud',
          updatedAt: 3000,
        }),
      });

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const { journalStore } = await import('./index');
      const entries = journalStore.list();
      expect(entries).toHaveLength(3);

      const byId = new Map(entries.map((e) => [e.id, e.title]));
      expect(byId.get('local-a')).toBe('A local'); // local-only, kept
      expect(byId.get('local-b')).toBe('B local'); // local newer, kept
      expect(byId.get('cloud-c')).toBe('C cloud'); // cloud-only, pulled
    });
  });

  describe('tombstone handling', () => {
    it('skips tombstones in cloud entries during merge', async () => {
      seedLocalEntries([]);
      setMockGetDocsData({
        'users/test-uid/entries/alive': makeEntry('alive', { updatedAt: 2000 }),
        'users/test-uid/entries/dead': {
          ...makeEntry('dead', { updatedAt: 3000 }),
          deleted: true,
        },
      });

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const { journalStore } = await import('./index');
      const entries = journalStore.list();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('alive');
    });

    it('purges tombstones older than 90 days', async () => {
      seedLocalEntries([]);
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      setMockGetDocsData({
        'users/test-uid/entries/tomb-old': {
          ...makeEntry('tomb-old'),
          deleted: true,
          updatedAt: Date.now() - ninetyDaysMs - 1000,
        },
      });

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      // writeBatch.commit should have deleted the old tombstone from mockDb.
      expect(mockDb['users/test-uid/entries/tomb-old']).toBeUndefined();
    });
  });

  describe('profile sync', () => {
    it('pulls cloud profile when newer', async () => {
      seedLocalEntries([]);
      mockDb['users/test-uid'] = {
        displayName: 'Cloud Name',
        joinedDate: 'January 2026',
        updatedAt: 5000,
      };

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const stored = JSON.parse(
        localStorage.getItem('jouspace:profile') ?? '{}',
      );
      expect(stored.displayName).toBe('Cloud Name');
      expect(stored.updatedAt).toBe(5000);
    });

    it('pushes local profile when newer', async () => {
      seedLocalEntries([]);
      localStorage.setItem(
        'jouspace:profile',
        JSON.stringify({
          displayName: 'Local Name',
          joinedDate: 'July 2026',
          updatedAt: 3000,
        }),
      );

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const profileCall = mockSetDocCalls.find(
        (c) => c.path === 'users/test-uid',
      );
      expect(profileCall).toBeDefined();
      expect(profileCall?.data.displayName).toBe('Local Name');
    });
  });

  describe('personalization sync', () => {
    it('pulls cloud personalization when newer', async () => {
      seedLocalEntries([]);
      mockDb['users/test-uid/personalization/self'] = {
        memoryNotes: 'User likes clarity and discipline',
        lastDigestAt: 8000,
        lastEntryCount: 10,
        updatedAt: 8000,
      };

      const { attachSync } = await import('./cloudSync');
      await attachSync('test-uid');

      const stored = JSON.parse(
        localStorage.getItem('jouspace:personalization') ?? '{}',
      );
      expect(stored.memoryNotes).toBe('User likes clarity and discipline');
      expect(stored.updatedAt).toBe(8000);
    });
  });

  describe('detach', () => {
    it('detachSync clears state without errors', async () => {
      seedLocalEntries([]);
      const { attachSync, detachSync, getSyncStatus } = await import(
        './cloudSync'
      );
      await attachSync('test-uid');
      expect(getSyncStatus()).toBe('synced');

      detachSync();
      expect(getSyncStatus()).toBe('idle');
    });
  });
});
