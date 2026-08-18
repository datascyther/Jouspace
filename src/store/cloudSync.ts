/**
 * cloudSync — Bidirectional Firestore ↔ localStorage sync engine.
 *
 * localStorage is the instant source of truth for the UI (snappy, works fully
 * offline). Firestore is the background mirror for cross-device sync on
 * authenticated accounts; unauthenticated users never touch Firestore.
 *
 * Architecture:
 *   attachSync(uid)   → initial merge → live onSnapshot listeners
 *   local write       → debounced push to Firestore (via journalStore.subscribe)
 *   Firestore change  → write to local store (isRemoteWrite flag) → notify subscribers
 *   detachSync()      → stop all listeners, clean up
 *
 * Entry merge strategy: merge-by-ID, last-write-wins (updatedAt).
 * Tombstones: entries deleted locally get `deleted:true` in Firestore so
 * other devices don't resurrect them. Tombstones older than 90 days are
 * purged on attach.
 *
 * Profile & personalization: single-document sync with LWW by updatedAt.
 * Communication with React hooks is via window CustomEvents:
 *   'jouspace:profile:remote-changed'
 *   'jouspace:personalization:remote-changed'
 *
 * Events received (dispatched by other modules):
 *   'jouspace:profile:local-changed'        → trigger profile push
 *   'jouspace:personalization:local-changed' → trigger personalization push
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDB } from '../lib/firestore';
import { journalStore } from './index';
import type { StoredEntry } from './types';

// ── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface SyncProfile {
  displayName: string;
  joinedDate: string;
  updatedAt: number;
}

interface SyncPersonalization {
  memoryNotes: string;
  lastDigestAt: number | null;
  lastEntryCount: number;
  updatedAt: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TOMBSTONE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const PUSH_DEBOUNCE_MS = 1000;
const PROFILE_KEY = 'jouspace:profile';
const PERSONALIZATION_KEY = 'jouspace:personalization';

// ── State ────────────────────────────────────────────────────────────────────

let attachedUid: string | null = null;
let unsubs: Unsubscribe[] = [];
let journalUnsub: (() => void) | null = null;
let statusListeners = new Set<(s: SyncStatus) => void>();
let currentStatus: SyncStatus = 'idle';
let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Tracks which entry IDs are known to exist in Firestore (for tombstone logic). */
let knownCloudIds = new Set<string>();

/**
 * Entry IDs that have been confirmed by the Firestore server (not pending
 * local writes). When the SDK rolls back a failed pending write, it fires
 * a synthetic `removed` change via onSnapshot — we must NOT let that delete
 * entries from localStorage. Only entries that were seen with
 * `!snapshot.metadata.hasPendingWrites` are eligible for server-initiated
 * removal.
 */
let serverConfirmedIds = new Set<string>();

/** Guards remote writes from being echoed back as local → cloud pushes. */
let isRemoteWrite = false;

/** Guards against re-entrant attach calls (StrictMode double-invoke). */
let attachGeneration = 0;

// ── Status ───────────────────────────────────────────────────────────────────

function setStatus(s: SyncStatus): void {
  currentStatus = s;
  statusListeners.forEach((cb) => cb(s));
}

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

export function onSyncStatusChange(cb: (s: SyncStatus) => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

export function isSyncActive(): boolean {
  return attachedUid !== null;
}

// ── Firestore reference helpers ──────────────────────────────────────────────

function entriesRef(uid: string) {
  return collection(getFirestoreDB()!, 'users', uid, 'entries');
}

function userRef(uid: string) {
  return doc(getFirestoreDB()!, 'users', uid);
}

function entryDocRef(uid: string, entryId: string) {
  return doc(getFirestoreDB()!, 'users', uid, 'entries', entryId);
}

function personalizationRef(uid: string) {
  return doc(getFirestoreDB()!, 'users', uid, 'personalization', 'self');
}

// ── localStorage read/write helpers ──────────────────────────────────────────

function readLocalProfile(): SyncProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Record<string, unknown>;
      return {
        displayName: typeof p.displayName === 'string' ? p.displayName : 'You',
        joinedDate: typeof p.joinedDate === 'string' ? p.joinedDate : '',
        updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
      };
    }
  } catch {
    /* corrupt */
  }
  return { displayName: 'You', joinedDate: '', updatedAt: 0 };
}

function writeLocalProfile(profile: SyncProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function readLocalPersonalization(): SyncPersonalization {
  try {
    const raw = localStorage.getItem(PERSONALIZATION_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Record<string, unknown>;
      return {
        memoryNotes: typeof p.memoryNotes === 'string' ? p.memoryNotes : '',
        lastDigestAt: typeof p.lastDigestAt === 'number' ? p.lastDigestAt : null,
        lastEntryCount: typeof p.lastEntryCount === 'number' ? p.lastEntryCount : 0,
        updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
      };
    }
  } catch {
    /* corrupt */
  }
  return { memoryNotes: '', lastDigestAt: null, lastEntryCount: 0, updatedAt: 0 };
}

function writeLocalPersonalization(p: SyncPersonalization): void {
  localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(p));
}

// ── Remote → Local apply ─────────────────────────────────────────────────────

function applyRemoteEntry(entry: StoredEntry): void {
  const local = journalStore.get(entry.id);
  isRemoteWrite = true;
  if (local) {
    // Only update if cloud is strictly newer (avoids unnecessary re-renders).
    if (entry.updatedAt > local.updatedAt) {
      journalStore.save({ ...entry, id: entry.id });
    }
  } else {
    // New entry from another device.
    journalStore.save({ ...entry, id: entry.id });
  }
  isRemoteWrite = false;
}

function applyRemoteEntryRemoval(entryId: string): void {
  // SAFETY: Only remove entries that the Firestore server has confirmed.
  // When a pending write fails (connection drop), the SDK fires a synthetic
  // `removed` onSnapshot event. Blindly removing here would delete entries
  // the user just saved locally but that never reached the server.
  if (!serverConfirmedIds.has(entryId)) {
    knownCloudIds.delete(entryId);
    return;
  }

  const local = journalStore.get(entryId);
  if (local) {
    isRemoteWrite = true;
    journalStore.remove(entryId);
    isRemoteWrite = false;
  }
  knownCloudIds.delete(entryId);
  serverConfirmedIds.delete(entryId);
}

function applyRemoteProfile(profile: SyncProfile): void {
  const local = readLocalProfile();
  if (profile.updatedAt > local.updatedAt) {
    writeLocalProfile(profile);
    window.dispatchEvent(new CustomEvent('jouspace:profile:remote-changed'));
  }
}

function applyRemotePersonalization(data: SyncPersonalization): void {
  const local = readLocalPersonalization();
  if (data.updatedAt > local.updatedAt) {
    writeLocalPersonalization(data);
    window.dispatchEvent(new CustomEvent('jouspace:personalization:remote-changed'));
  }
}

// ── Local → Remote push ──────────────────────────────────────────────────────

function pushEntry(uid: string, entry: StoredEntry): void {
  if (!getFirestoreDB()) return;
  try {
    setDoc(entryDocRef(uid, entry.id), entry);
  } catch (err) {
    console.error('[cloudSync] pushEntry failed:', err);
  }
}

function pushTombstone(uid: string, entryId: string, updatedAt: number): void {
  if (!getFirestoreDB()) return;
  try {
    setDoc(entryDocRef(uid, entryId), {
      id: entryId,
      date: '',
      title: '',
      theme: '',
      content: '',
      createdAt: updatedAt,
      updatedAt,
      deleted: true,
    } satisfies StoredEntry & { deleted: true });
  } catch (err) {
    console.error('[cloudSync] pushTombstone failed:', err);
  }
}

function pushProfile(uid: string): void {
  if (!getFirestoreDB()) return;
  try {
    const local = readLocalProfile();
    local.updatedAt = Date.now();
    writeLocalProfile(local);
    setDoc(userRef(uid), local);
  } catch (err) {
    console.error('[cloudSync] pushProfile failed:', err);
  }
}

function pushPersonalization(uid: string): void {
  if (!getFirestoreDB()) return;
  try {
    const local = readLocalPersonalization();
    local.updatedAt = Date.now();
    writeLocalPersonalization(local);
    setDoc(personalizationRef(uid), local);
  } catch (err) {
    console.error('[cloudSync] pushPersonalization failed:', err);
  }
}

// ── Journal entry sync (local → remote, debounced) ───────────────────────────

function onJournalLocalChange(): void {
  if (isRemoteWrite) return;
  if (!attachedUid || !getFirestoreDB()) return;

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => flushJournalPush(attachedUid!), PUSH_DEBOUNCE_MS);
}

function flushJournalPush(uid: string): void {
  if (!getFirestoreDB()) return;

  const localEntries = journalStore.list();
  const localIds = new Set(localEntries.map((e) => e.id));

  // Push all local entries (create or update).
  for (const entry of localEntries) {
    pushEntry(uid, entry);
    knownCloudIds.add(entry.id);
  }

  // For entries that were in knownCloudIds but are no longer local:
  // they were deleted locally → push tombstone.
  for (const cloudId of knownCloudIds) {
    if (!localIds.has(cloudId)) {
      pushTombstone(uid, cloudId, Date.now());
      knownCloudIds.delete(cloudId);
    }
  }
}

// ── Online reconnect flush ───────────────────────────────────────────────────

function handleOnline(): void {
  if (attachedUid) flushJournalPush(attachedUid);
}

// ── Live Firestore listeners ─────────────────────────────────────────────────

function attachEntriesListener(uid: string): Unsubscribe {
  return onSnapshot(entriesRef(uid), (snapshot) => {
    for (const change of snapshot.docChanges()) {
      const data = change.doc.data() as StoredEntry & { deleted?: boolean };

      if (change.type === 'removed') {
        applyRemoteEntryRemoval(change.doc.id);
        continue;
      }

      if (data.deleted) {
        // Tombstone: remove local entry if it exists.
        applyRemoteEntryRemoval(change.doc.id);
        continue;
      }

      // added or modified: apply if cloud is strictly newer.
      applyRemoteEntry({ ...data, id: change.doc.id });
      knownCloudIds.add(change.doc.id);

      // Track server-confirmed entries. Only entries without pending writes
      // are safe to remove later — pending writes may be rolled back on
      // connection loss, producing a synthetic `removed` change.
      if (!snapshot.metadata.hasPendingWrites) {
        serverConfirmedIds.add(change.doc.id);
      }
    }
  }, (err) => {
    console.error('[cloudSync] entries listener error:', err);
  });
}

function attachProfileListener(uid: string): Unsubscribe {
  return onSnapshot(userRef(uid), (snap) => {
    if (snap.exists()) {
      applyRemoteProfile(snap.data() as SyncProfile);
    }
  }, (err) => {
    console.error('[cloudSync] profile listener error:', err);
  });
}

function attachPersonalizationListener(uid: string): Unsubscribe {
  return onSnapshot(personalizationRef(uid), (snap) => {
    if (snap.exists()) {
      applyRemotePersonalization(snap.data() as SyncPersonalization);
    }
  }, (err) => {
    console.error('[cloudSync] personalization listener error:', err);
  });
}

// ── Stale tombstone purge (>90 days) ────────────────────────────────────────

async function purgeStaleTombstones(uid: string): Promise<void> {
  if (!getFirestoreDB()) return;
  try {
    const snapshot = await getDocs(entriesRef(uid));
    const cutoff = Date.now() - TOMBSTONE_MAX_AGE_MS;
    const batch = writeBatch(getFirestoreDB()!);
    let count = 0;

    for (const d of snapshot.docs) {
      const data = d.data() as DocumentData & { deleted?: boolean; updatedAt?: number };
      if (data.deleted && data.updatedAt && data.updatedAt < cutoff) {
        batch.delete(d.ref);
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    // Non-fatal — purged on next launch.
    console.error('[cloudSync] tombstone purge failed:', err);
  }
}

// ── Initial merge ────────────────────────────────────────────────────────────

async function initialMerge(uid: string): Promise<void> {
  setStatus('syncing');

  try {
    // 1. Fetch all cloud entries.
    const cloudSnapshot = await getDocs(entriesRef(uid));
    const cloudEntries: StoredEntry[] = [];

    for (const d of cloudSnapshot.docs) {
      const data = d.data() as StoredEntry & { deleted?: boolean };
      if (data.deleted) continue; // Skip tombstones — they don't merge as entries.
      cloudEntries.push({ ...data, id: d.id });
      knownCloudIds.add(d.id);
      // Entries fetched via getDocs are confirmed by the server.
      serverConfirmedIds.add(d.id);
    }

    // 2. Merge entries by ID (LWW by updatedAt).
    const localEntries = journalStore.list();
    const mergedMap = new Map<string, StoredEntry>();

    // Start with local entries.
    for (const entry of localEntries) {
      mergedMap.set(entry.id, entry);
    }

    // Merge cloud entries.
    for (const cloudEntry of cloudEntries) {
      const local = mergedMap.get(cloudEntry.id);
      if (!local) {
        // Cloud-only: add locally.
        mergedMap.set(cloudEntry.id, cloudEntry);
      } else if (cloudEntry.updatedAt >= local.updatedAt) {
        // Cloud is newer or equal: use cloud version.
        mergedMap.set(cloudEntry.id, cloudEntry);
      }
      // else: local is newer, keep local (already in map).
    }

    // 3. Write merged result to local store (single notification).
    const merged = [...mergedMap.values()];
    isRemoteWrite = true;
    journalStore.importEntries(merged, 'replace');
    isRemoteWrite = false;

    // 4. Push local-only entries to cloud.
    for (const entry of merged) {
      if (!knownCloudIds.has(entry.id)) {
        pushEntry(uid, entry);
        knownCloudIds.add(entry.id);
      }
    }

    // 5. Merge profile (LWW by updatedAt).
    const localProfile = readLocalProfile();
    const hasRealProfile =
      localProfile.displayName !== 'You' || localProfile.joinedDate !== '';
    try {
      const profileSnap = await getDoc(userRef(uid));
      if (profileSnap.exists()) {
        const cloudProfile = profileSnap.data() as SyncProfile;
        if (cloudProfile.updatedAt > localProfile.updatedAt) {
          writeLocalProfile(cloudProfile);
          window.dispatchEvent(new CustomEvent('jouspace:profile:remote-changed'));
        } else if (hasRealProfile) {
          pushProfile(uid);
        }
      } else if (hasRealProfile) {
        pushProfile(uid);
      }
    } catch (err) {
      console.error('[cloudSync] profile merge failed:', err);
    }

    // 6. Merge personalization (LWW by updatedAt).
    const localPers = readLocalPersonalization();
    const hasRealPers =
      localPers.lastDigestAt !== null || localPers.memoryNotes !== '';
    try {
      const persSnap = await getDoc(personalizationRef(uid));
      if (persSnap.exists()) {
        const cloudPers = persSnap.data() as SyncPersonalization;
        if (cloudPers.updatedAt > localPers.updatedAt) {
          writeLocalPersonalization(cloudPers);
          window.dispatchEvent(
            new CustomEvent('jouspace:personalization:remote-changed'),
          );
        } else if (hasRealPers) {
          pushPersonalization(uid);
        }
      } else if (hasRealPers) {
        pushPersonalization(uid);
      }
    } catch (err) {
      console.error('[cloudSync] personalization merge failed:', err);
    }

    // 7. Purge stale tombstones (>90 days) — non-blocking, best-effort.
    void purgeStaleTombstones(uid);

    setStatus('synced');
  } catch (err) {
    console.error('[cloudSync] initial merge failed:', err);
    setStatus('error');
  }
}

// ── Attach / Detach ──────────────────────────────────────────────────────────

async function attachSyncInner(uid: string): Promise<void> {
  const gen = ++attachGeneration;
  setStatus('syncing');

  // Initial merge (reads cloud, merges with local, pushes local-only).
  await initialMerge(uid);

  // Guard: if detachSync was called during the async merge, bail out.
  if (attachGeneration !== gen) return;

  // Attach live Firestore listeners (only after merge is complete).
  unsubs.push(attachEntriesListener(uid));
  unsubs.push(attachProfileListener(uid));
  unsubs.push(attachPersonalizationListener(uid));

  // Subscribe to local journal changes → debounced push.
  journalUnsub = journalStore.subscribe(onJournalLocalChange);

  // Subscribe to local profile/personalization changes via window events.
  window.addEventListener('jouspace:profile:local-changed', onProfileLocal);
  window.addEventListener(
    'jouspace:personalization:local-changed',
    onPersonalizationLocal,
  );

  // Flush pending pushes on network reconnect.
  window.addEventListener('online', handleOnline);

  if (attachGeneration === gen) setStatus('synced');
}

function onProfileLocal(): void {
  if (attachedUid) pushProfile(attachedUid);
}

function onPersonalizationLocal(): void {
  if (attachedUid) pushPersonalization(attachedUid);
}

/**
 * Attach sync for an authenticated user.
 * Safe to call multiple times — detaches from previous user if switching.
 * No-op when Firebase is not configured.
 */
export async function attachSync(uid: string): Promise<void> {
  if (!getFirestoreDB()) return;
  if (!uid) return;

  // If already attached to the same user, no-op.
  if (attachedUid === uid && currentStatus !== 'error') return;

  // Detach from previous user if any.
  if (attachedUid) detachSync();

  attachedUid = uid;
  await attachSyncInner(uid);
}

/**
 * Force a re-sync from Firestore on demand ("pull to refresh"). Pushes any
 * pending local writes, pulls the latest cloud state, and re-runs the same LWW
 * merge used at attach. Returns true on success; false on failure. Never
 * throws. Local data is only rewritten AFTER a successful cloud read (see
 * initialMerge), so a failed refresh can never delete an entry. Cosmetic
 * no-op (resolves true) for local-only / not-signed-in users.
 */
export async function refreshSync(): Promise<boolean> {
  if (!attachedUid || !getFirestoreDB()) return true;
  setStatus('syncing');
  try {
    await initialMerge(attachedUid);
    flushJournalPush(attachedUid);
    return getSyncStatus() !== 'error';
  } catch (err) {
    console.error('[cloudSync] refreshSync failed:', err);
    setStatus('error');
    return false;
  }
}

/**
 * Detach sync — stop all listeners, clear state.
 * Local data is NOT wiped; the journal remains readable.
 */
export function detachSync(): void {
  attachGeneration++;

  // Unsubscribe all Firestore listeners.
  for (const unsub of unsubs) {
    try { unsub(); } catch { /* non-fatal */ }
  }
  unsubs = [];

  // Unsubscribe journal store listener.
  if (journalUnsub) {
    journalUnsub();
    journalUnsub = null;
  }

  // Remove window event listeners.
  window.removeEventListener('jouspace:profile:local-changed', onProfileLocal);
  window.removeEventListener(
    'jouspace:personalization:local-changed',
    onPersonalizationLocal,
  );
  window.removeEventListener('online', handleOnline);

  // Clear push timer.
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }

  // Clear state.
  knownCloudIds.clear();
  serverConfirmedIds.clear();
  attachedUid = null;
  setStatus('idle');
}
