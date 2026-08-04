/**
 * useJournalTimeline — React-Query wrapper around ReflectionService.getTimeline().
 *
 * The Timeline screen (Sprint 2.4) calls this hook; the service owns all
 * derivation so the screen stays presentational. Invalidate with
 * JOURNAL_TIMELINE_QUERY_KEY(uid).
 */

import { useQuery } from '@tanstack/react-query';
import { reflectionService } from '../services/ReflectionService';
import type { JournalTimeline } from '../services/ReflectionService';
import { useUserId } from '@/shared/hooks/useAuth';

export const JOURNAL_TIMELINE_QUERY_KEY = (uid: string | null) =>
  ['journal', 'timeline', uid] as const;

export function useJournalTimeline() {
  const uid = useUserId();

  return useQuery<JournalTimeline>({
    queryKey: JOURNAL_TIMELINE_QUERY_KEY(uid),
    queryFn: () => reflectionService.getTimeline(uid as string),
    enabled: !!uid,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
