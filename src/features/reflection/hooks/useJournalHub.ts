/**
 * useJournalHub — React-Query wrapper around ReflectionService.getHub().
 *
 * Hub screen calls this hook; the service owns all aggregation. Invalidate
 * with `JOURNAL_HUB_QUERY_KEY(uid)` to force a refresh after a save.
 */

import { useQuery } from '@tanstack/react-query';
import { reflectionService } from '../services/ReflectionService';
import { useUserId } from '@/shared/hooks/useAuth';

export const JOURNAL_HUB_QUERY_KEY = (uid: string | null) =>
  ['journal', uid] as const;

export function useJournalHub() {
  const uid = useUserId();

  return useQuery({
    queryKey: JOURNAL_HUB_QUERY_KEY(uid),
    queryFn: () => reflectionService.getHub(uid as string),
    enabled: !!uid,
    // Keep cached data usable across tab switches so warm opens render
    // instantly without a skeleton flash.
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
