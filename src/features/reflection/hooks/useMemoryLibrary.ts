/**
 * useMemoryLibrary — React-Query wrapper around ReflectionService.getMemoryLibrary().
 *
 * The Memory Library screen (Sprint 2.5) calls this hook; the service owns all
 * derivation (curated memories + AI-suggested candidates) so the screen stays
 * presentational. Invalidate with JOURNAL_MEMORY_QUERY_KEY(uid).
 */

import { useQuery } from '@tanstack/react-query';
import { reflectionService } from '../services/ReflectionService';
import type { MemoryLibrary } from '../services/ReflectionService';
import { useUserId } from '@/shared/hooks/useAuth';

export const JOURNAL_MEMORY_QUERY_KEY = (uid: string | null) =>
  ['journal', 'memory', uid] as const;

export function useMemoryLibrary() {
  const uid = useUserId();

  return useQuery<MemoryLibrary>({
    queryKey: JOURNAL_MEMORY_QUERY_KEY(uid),
    queryFn: () => reflectionService.getMemoryLibrary(uid as string),
    enabled: !!uid,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
