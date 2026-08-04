/**
 * useWeeklyReview — React-Query wrapper around ReflectionService.getWeeklyReview().
 *
 * The Weekly Review screen (Sprint 2.7) calls this hook; the service owns all
 * derivation so the screen stays presentational. Invalidate with
 * JOURNAL_WEEKLY_QUERY_KEY(uid).
 */

import { useQuery } from '@tanstack/react-query';
import { reflectionService } from '../services/ReflectionService';
import type { WeeklyReview } from '../services/ReflectionService';
import { useUserId } from '@/shared/hooks/useAuth';

export const JOURNAL_WEEKLY_QUERY_KEY = (uid: string | null) =>
  ['journal', 'weekly', uid] as const;

export function useWeeklyReview() {
  const uid = useUserId();

  return useQuery<WeeklyReview>({
    queryKey: JOURNAL_WEEKLY_QUERY_KEY(uid),
    queryFn: () => reflectionService.getWeeklyReview(uid as string),
    enabled: !!uid,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
