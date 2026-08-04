// src/features/home/hooks/useHomeViewModel.ts
//
// React-Query wrapper around HomeViewModel.getHomeScreenData().
// HomeScreen calls this hook; the ViewModel owns all data fetching.

import { useQuery } from '@tanstack/react-query';
import { homeViewModel } from '@/features/home/services/HomeViewModel';

/** Stable query key — invalidate with ['homeScreenData'] to force a refresh. */
export const HOME_SCREEN_QUERY_KEY = ['homeScreenData'] as const;

export function useHomeViewModel() {
  return useQuery({
    queryKey: HOME_SCREEN_QUERY_KEY,
    queryFn: () => homeViewModel.getHomeScreenData(),
    // Only run when the hook mounts (auth is handled inside profileService.getCurrent)
    staleTime: 30_000, // 30 s — reduce redundant re-fetches while app is open
  });
}
