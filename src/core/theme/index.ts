/**
 * Compatibility shim for `@/core/theme`.
 *
 * After the theme consolidation, the single source of truth is `src/theme/*`.
 * This barrel re-exports everything from there so existing imports
 * (`@/core/theme`, `@/core/theme/tokens`, `@/core/theme/colors`) keep working
 * without touching call sites.
 */
export * from '@/theme';
export * from '@/theme/tokens';
export { palette } from '@/theme/colors';
export type { Theme, ThemeMode } from '@/types';
