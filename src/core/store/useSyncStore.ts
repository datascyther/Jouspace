import { create } from 'zustand';
import { Platform } from 'react-native';
import { QueryClient } from '@tanstack/react-query';
import { storageService } from '@/services/storage';
import { moodRepository } from '@/repositories/MoodRepository';
import { profileRepository } from '@/repositories/ProfileRepository';
import { journalRepository } from '@/repositories/JournalRepository';
import { journalRepository as backendJournalRepo } from '../../../backend/repositories/JournalRepository';
import { NotAuthenticatedError } from '../../../backend/repositories/baseRepository';
import { useAppStore } from './useAppStore';
import { logger } from '@/services/logging';
import type { Mood } from '@/shared/types';
import type { JournalRow } from '../../../backend/services/JournalService';
import type { JournalPatch } from '../../../backend/repositories/JournalRepository';

const STORAGE_KEY = 'sync_queue';
const MAX_RETRIES = 5;

export interface SyncQueueItem {
  id: string;
  type: 'save_mood' | 'save_exercise_progress' | 'update_profile'
       | 'complete_lesson' | 'save_recommendation' | 'save_streak'
       | 'save_journal_entry' | 'update_journal_entry' | 'remove_journal_entry';
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
  retryCount: number;
}

export interface SyncState {
  pendingQueue: SyncQueueItem[];
  isSyncing: boolean;
  lastError: string | null;
  isOnline: boolean;
  initializeQueue: () => Promise<void>;
  enqueueItem: (
    type: SyncQueueItem['type'],
    payload: any,
    queryClient: QueryClient
  ) => Promise<void>;
  processQueue: (queryClient: QueryClient) => Promise<void>;
  clearQueue: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean, queryClient?: QueryClient) => Promise<void>;
}

export async function checkOnline(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
    clearTimeout(id);
    return true;
  } catch {
    return false;
  }
}

function isAlreadySynced(item: SyncQueueItem, queryClient: QueryClient): boolean {
  try {
    // Journal entries: always attempt the cloud write. JournalRepository
    // .syncToCloud() dedupes by content, so an interrupted/re-run queue can
    // never create duplicate rows.
    if (item.type === 'save_journal_entry') {
      return false;
    }

    // Update/remove are idempotent against the backend; always attempt the
    // cloud write so an offline edit/delete replays once the connection returns.
    if (item.type === 'update_journal_entry' || item.type === 'remove_journal_entry') {
      return false;
    }

    if (item.type === 'save_mood') {
      const { uid, entry } = item.payload;
      if (!uid || !entry?.id) return false;
      const cached = queryClient.getQueryData<any[]>(['moods', uid]);
      if (!cached) return false;
      return cached.some((m: any) => m.id === entry.id);
    }

    if (item.type === 'update_profile') {
      const { uid, updates } = item.payload;
      if (!uid || !updates) return false;
      const cached = queryClient.getQueryData<any>(['profile', uid]);
      if (!cached) return false;
      return Object.keys(updates).every((key) => cached[key] === updates[key]);
    }

    if (item.type === 'save_recommendation') {
      const { uid, recId } = item.payload;
      if (!uid || !recId) return false;
      const cached = queryClient.getQueryData<any[]>(['journey', 'recommendations', uid]);
      if (!cached) return false;
      return cached.some((r: any) => r.id === recId);
    }

    if (item.type === 'save_streak') {
      const { uid } = item.payload;
      if (!uid) return false;
      const cached = queryClient.getQueryData<any>(['journey', 'streak', uid]);
      return cached != null;
    }
  } catch {
    // If cache check fails, proceed with sync to be safe
  }
  return false;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  pendingQueue: [],
  isSyncing: false,
  lastError: null,
  isOnline: true,

  initializeQueue: async () => {
    try {
      const savedQueue = await storageService.getJSON<SyncQueueItem[]>(STORAGE_KEY);
      if (savedQueue && Array.isArray(savedQueue)) {
        const sanitized = savedQueue.map((item) =>
          item.status === 'syncing' ? { ...item, status: 'pending' as const } : item
        );
        set({ pendingQueue: sanitized });
      }
      const online = await checkOnline();
      set({ isOnline: online });
    } catch (err) {
      console.error('[useSyncStore] Queue initialization failed:', err);
    }
  },

  enqueueItem: async (type, payload, queryClient) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newItem: SyncQueueItem = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    logger.info('sync', 'Enqueue', { type, id });

    if (type === 'save_mood') {
      const { uid, entry } = payload;
      if (uid && entry) {
        await moodRepository.persistMoods(uid, [entry]);
      }
    }

    if (type === 'save_journal_entry') {
      const { uid, entry } = payload;
      if (uid && entry) {
        await journalRepository.persistEntries(uid, [entry]);
      }
    }

    if (type === 'update_journal_entry') {
      const { uid, id, patch } = payload as { uid: string; id: string; patch: JournalPatch };
      if (uid && id) {
        await journalRepository.updateLocal(uid, id, patch);
      }
    }

    if (type === 'remove_journal_entry') {
      const { uid, id } = payload as { uid: string; id: string };
      if (uid && id) {
        await journalRepository.removeLocal(uid, id);
      }
    }

    const updatedQueue = [...get().pendingQueue, newItem];
    set({ pendingQueue: updatedQueue });
    // Persisting the queue must never block or abort the originating action
    // (e.g. a mood check-in). The in-memory queue is already authoritative.
    try {
      await storageService.setJSON(STORAGE_KEY, updatedQueue);
    } catch (err) {
      logger.warn('sync', 'Failed to persist sync queue', { error: String(err) });
    }

    if (type === 'save_mood') {
      const { uid, entry } = payload;
      if (uid && entry) {
        queryClient.setQueryData(['moods', uid], (old: any[] = []) => {
          if (old.some((m) => m.id === entry.id)) return old;
          return [...old, entry];
        });
      }
    } else if (type === 'update_profile') {
      const { uid, updates } = payload;
      if (uid && updates) {
        const userStore = useAppStore.getState();
        const currentUser = userStore.session.user;
        if (currentUser && currentUser.uid === uid) {
          userStore.setUser({ ...currentUser, ...updates });
        }
      }
    } else if (type === 'save_journal_entry') {
      const { uid, entry } = payload;
      if (uid && entry) {
        queryClient.setQueryData(['journal', uid], (old: any[] = []) => {
          if (old.some((m) => m.id === entry.id)) return old;
          return [entry, ...old];
        });
      }
    } else if (type === 'update_journal_entry') {
      const { uid, id, patch } = payload as { uid: string; id: string; patch: JournalPatch };
      if (uid && id) {
        queryClient.setQueryData(['journal', uid], (old: any[] = []) =>
          old.map((e) => (e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e)),
        );
        queryClient.setQueryData(['journal', 'detail', id], (old: any) =>
          old ? { ...old, ...patch, updated_at: new Date().toISOString() } : old,
        );
      }
    } else if (type === 'remove_journal_entry') {
      const { uid, id } = payload as { uid: string; id: string };
      if (uid && id) {
        queryClient.setQueryData(['journal', uid], (old: any[] = []) =>
          old.filter((e) => e.id !== id),
        );
        queryClient.removeQueries({ queryKey: ['journal', 'detail', id] });
      }
    }

    void get().processQueue(queryClient);
  },

  processQueue: async (queryClient) => {
    if (get().isSyncing) return;

    const online = await checkOnline();
    set({ isOnline: online });
    if (!online) return;

    const queue = get().pendingQueue;
    if (queue.length === 0) return;

    set({ isSyncing: true, lastError: null });

    const updatedQueue = [...queue];
    let hasChanges = false;

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status === 'syncing') continue;

      if (item.retryCount >= MAX_RETRIES) {
        updatedQueue[i] = {
          ...item,
          status: 'failed',
          error: `Exceeded max retries (${MAX_RETRIES})`,
        };
        logger.error('sync', 'Max retries exceeded', { type: item.type, id: item.id });
        hasChanges = true;
        continue;
      }

      if (isAlreadySynced(item, queryClient)) {
        updatedQueue.splice(i, 1);
        i--;
        hasChanges = true;
        continue;
      }

      updatedQueue[i] = { ...item, status: 'syncing' };
      set({ pendingQueue: [...updatedQueue] });

      try {
        if (item.type === 'save_mood') {
          const { uid, entry } = item.payload as { uid: string; entry: Mood };
          await moodRepository.syncToCloud(uid, entry);
          queryClient.invalidateQueries({ queryKey: ['moods', uid] });
        } else if (item.type === 'save_journal_entry') {
          const { uid, entry } = item.payload as { uid: string; entry: JournalRow };
          await journalRepository.syncToCloud(uid, entry);
          queryClient.invalidateQueries({ queryKey: ['journal', uid] });
        } else if (item.type === 'update_journal_entry') {
          const { uid, id, patch } = item.payload as {
            uid: string;
            id: string;
            patch: JournalPatch;
          };
          await backendJournalRepo.update(id, patch);
          queryClient.invalidateQueries({ queryKey: ['journal', uid] });
        } else if (item.type === 'remove_journal_entry') {
          const { uid, id } = item.payload as { uid: string; id: string };
          await backendJournalRepo.remove(id);
          queryClient.invalidateQueries({ queryKey: ['journal', uid] });
        } else if (item.type === 'update_profile') {
          const { uid, updates } = item.payload;
          const currentProfile = useAppStore.getState().session.user;
          if (currentProfile) {
            await profileRepository.updateProfile(uid, updates, currentProfile);
          }
        }

        logger.info('sync', 'Processed', { type: item.type, id: item.id });
        updatedQueue.splice(i, 1);
        i--;
        hasChanges = true;
      } catch (error) {
        if (error instanceof NotAuthenticatedError) {
          // Cloud writes require a real Supabase session. In fallback guest mode
          // (no session) the local copy is the source of truth, so drop the item
          // instead of retrying/failing. It will sync once the user authenticates.
          logger.info('sync', 'Skipped cloud sync (not authenticated)', { type: item.type, id: item.id });
          updatedQueue.splice(i, 1);
          i--;
          hasChanges = true;
          continue;
        }

        logger.error('sync', 'Process error', { type: item.type, id: item.id, error: String(error) });

        const isNetworkError =
          error instanceof Error &&
          (error.message.includes('network') ||
            error.message.includes('offline') ||
            error.message.includes('connection') ||
            error.message.includes('Failed to fetch'));

        if (isNetworkError) {
          updatedQueue[i] = {
            ...item,
            status: 'pending',
            retryCount: item.retryCount + 1,
          };
          set({ isOnline: false });
          break;
        } else {
          updatedQueue[i] = {
            ...item,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Permanent failure',
            retryCount: item.retryCount + 1,
          };
          set({ lastError: error instanceof Error ? error.message : 'Sync execution failed' });
        }
        hasChanges = true;
      }
    }

    if (hasChanges) {
      set({ pendingQueue: updatedQueue });
      await storageService.setJSON(STORAGE_KEY, updatedQueue);
    }

    set({ isSyncing: false });
  },

  clearQueue: async () => {
    set({ pendingQueue: [], lastError: null });
    await storageService.delete(STORAGE_KEY);
  },

  setOnlineStatus: async (isOnline, queryClient) => {
    set({ isOnline });
    if (isOnline && queryClient) {
      void get().processQueue(queryClient);
    }
  },
}));

export default useSyncStore;
