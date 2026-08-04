/**
 * useSaveJournal — enqueues a journal entry into the offline-first sync queue.
 *
 * Mirrors `useSaveMood`: the screen builds a local optimistic row, enqueues it,
 * and the SyncStore persists it locally + updates the `['journal', uid]` cache
 * immediately, then pushes to the cloud via JournalRepository.syncToCloud().
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSyncStore } from '@/core/store/useSyncStore';
import type { JournalRow } from '../../../../backend/services/JournalService';
import type { JournalInput } from '../../../../backend/repositories/JournalRepository';

export function useSaveJournal() {
  const queryClient = useQueryClient();
  const enqueueItem = useSyncStore((state) => state.enqueueItem);

  return useMutation({
    mutationFn: async ({ uid, input }: { uid: string; input: JournalInput }) => {
      const entry: JournalRow = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        user_id: uid,
        title: input.title ?? null,
        body: input.body ?? null,
        mood_id: input.mood_id ?? null,
        attachments: input.attachments ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await enqueueItem('save_journal_entry', { uid, entry }, queryClient);
      return entry;
    },
  });
}
