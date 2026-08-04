import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moodRepository } from '@/repositories/MoodRepository';
import type { Mood } from '@/shared/types';
import { useSyncStore } from '@/core/store/useSyncStore';

const MOOD_QUERY_KEY = ['moods'] as const;

export function useMoodEntries(uid: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...MOOD_QUERY_KEY, uid],
    queryFn: async () => {
      if (!uid) return [];
      return moodRepository.loadMoods(uid);
    },
    enabled: !!uid,
    staleTime: Infinity,
  });

  // Background cloud sync after initial render — never blocks the UI
  useEffect(() => {
    if (!uid) return;
    const sync = async () => {
      try {
        const merged = await moodRepository.syncFromCloud(uid);
        if (merged.length > 0) {
          queryClient.setQueryData([...MOOD_QUERY_KEY, uid], merged);
        }
      } catch {
        // Silently fail — local data is already displayed
      }
    };
    // Small delay to ensure UI renders first with local data
    const timer = setTimeout(() => void sync(), 100);
    return () => clearTimeout(timer);
  }, [uid, queryClient]);

  const pendingQueue = useSyncStore((state) => state.pendingQueue);
  const pendingMoods = useMemo(() => {
    return pendingQueue
      .filter((item) => item.type === 'save_mood' && item.payload.uid === uid)
      .map((item) => item.payload.entry as Mood);
  }, [pendingQueue, uid]);

  return {
    ...query,
    data: useMemo(() => {
      if (!query.data) return undefined;
      const merged = [...query.data];
      pendingMoods.forEach((pm) => {
        const idx = merged.findIndex((m) => m.id === pm.id);
        if (idx >= 0) {
          merged[idx] = pm;
        } else {
          merged.push(pm);
        }
      });
      // Sort by timestamp asc
      return merged.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }, [query.data, pendingMoods]),
  };
}

export function useSaveMood() {
  const queryClient = useQueryClient();
  const enqueueItem = useSyncStore((state) => state.enqueueItem);

  return useMutation({
    mutationFn: async ({ uid, entry }: { uid: string; entry: Mood }) => {
      await enqueueItem('save_mood', { uid, entry }, queryClient);
      return entry;
    },
  });
}

/**
 * Get today's mood entries (computed client-side).
 */
export function getTodayMoodEntries(entries: Mood[]): Mood[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= today;
  });
}
