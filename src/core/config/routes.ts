/**
 * Jouspace — Route Constants
 *
 * Centralised route names for Expo Router navigation.
 * Prevents hardcoded strings across the codebase.
 */

export const ROUTES = {
  // ─── Auth ───────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    ONBOARDING: '/onboarding',
  } as const,

  // ─── Tabs ───────────────────────────────────────────────────────────
  TABS: {
    HOME: '/(tabs)',
    CHAT: '/(tabs)/chat',
    JOURNAL: '/(tabs)/journal',
    PROFILE: '/(tabs)/profile',
  } as const,

  // ─── Journal ────────────────────────────────────────────────────────────
  JOURNAL: {
    HOME: '/(tabs)/journal',
    NEW: '/(tabs)/journal/new',
    DETAIL: '/(tabs)/journal/[id]',
    DRAFTS: '/(tabs)/journal/drafts',
    HISTORY: '/(tabs)/journal/history',
    TIMELINE: '/(tabs)/journal/timeline',
    WEEKLY: '/(tabs)/journal/weekly',
    SEARCH: '/(tabs)/journal/search',
    REFLECTION: '/(tabs)/journal/reflection',
    MEMORY: '/(tabs)/journal/memory',
  } as const,
} as const;

export type RouteName = keyof typeof ROUTES;
export type TabRoute = keyof typeof ROUTES.TABS;
export type AuthRoute = keyof typeof ROUTES.AUTH;

/**
 * Resolves a route template like `/journey/program/[programId]`
 * with the given params object into a real path.
 */
export function buildRoute(
  template: string,
  params: Record<string, string>,
): string {
  let path = template;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`[${key}]`, value);
  }
  return path;
}
