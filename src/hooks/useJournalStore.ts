/**
 * useJournalStore — React binding for the JournalStore.
 *
 * Returns the current entry list plus write helpers. Any change to the store
 * (local writes now, cloud sync later) re-renders the consumer via `subscribe`.
 */

import { useEffect, useMemo, useState } from 'react';
import { journalStore } from '../store';
import type { StoredEntry, NewEntryInput } from '../store/types';

export interface UseJournalStoreReturn {
  entries: StoredEntry[];
  /** Bumped on every store change — handy as a dependency key */
  version: number;
  get: (id: string) => StoredEntry | undefined;
  save: (input: NewEntryInput) => StoredEntry;
  remove: (id: string) => boolean;
}

export function useJournalStore(): UseJournalStoreReturn {
  const [entries, setEntries] = useState<StoredEntry[]>(() =>
    journalStore.list()
  );
  const [version, setVersion] = useState(0);

  useEffect(
    () =>
      journalStore.subscribe(() => {
        setEntries(journalStore.list());
        setVersion((v) => v + 1);
      }),
    []
  );

  return useMemo(
    () => ({
      entries,
      version,
      get: (id: string) => journalStore.get(id),
      save: (input: NewEntryInput) => journalStore.save(input),
      remove: (id: string) => journalStore.remove(id),
    }),
    [entries, version]
  );
}
