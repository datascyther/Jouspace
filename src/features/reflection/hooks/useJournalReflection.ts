/**
 * useJournalReflection — React-Query wrapper around ReflectionService.getReflection().
 *
 * The R1 screen calls this hook; the service owns all derivation so the screen
 * stays presentational. Invalidate with `JOURNAL_REFLECTION_QUERY_KEY(uid)`.
 */

import { useQuery } from '@tanstack/react-query';
import { reflectionService } from '../services/ReflectionService';
import type { JournalReflection } from '../services/ReflectionService';
import { useUserId } from '@/shared/hooks/useAuth';

export const JOURNAL_REFLECTION_QUERY_KEY = (uid: string | null) =>
  ['journal', 'reflection', uid] as const;

export function useJournalReflection() {
  const uid = useUserId();

  return useQuery<JournalReflection>({
    queryKey: JOURNAL_REFLECTION_QUERY_KEY(uid),
    queryFn: () => reflectionService.getReflection(uid as string),
    enabled: !!uid,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
