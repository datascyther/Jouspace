// src/features/home/hooks/useHomeState.ts
//
// React-Query wrapper around HomeService.fetchHomeState().
// HomeScreen calls this hook; the service owns all aggregation.

import { useQuery } from '@tanstack/react-query';
import { homeService } from '@/features/home/services/HomeService';

/** Stable query key — invalidate with ['homeState'] to force a refresh. */
export const HOME_STATE_QUERY_KEY = ['homeState'] as const;

export function useHomeState() {
  return useQuery({
    queryKey: HOME_STATE_QUERY_KEY,
    queryFn: () => homeService.fetchHomeState(),
    // Show the previous (cached) result instantly on warm opens while the
    // fresh data refetches in the background — avoids a skeleton flash.
    placeholderData: (prev) => prev,
    // Keep cached data usable across reopen. A short stale window means
    // re-mounting the tab (app entry, tab switch) does NOT trigger a full
    // 6-call refetch every time — only when the cache has actually gone
    // stale. Warm opens therefore render instantly with no loading hang.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    // Refetch in the background on mount only when data is stale; never
    // block the UI on it (placeholderData keeps the old screen visible).
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
