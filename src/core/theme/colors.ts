/**
 * Compatibility shim — was the legacy purple/cyan palette + raw ramps.
 * Now re-exports from the unified theme source (src/theme/colors) so any
 * file importing `@/core/theme/colors` keeps working.
 */
export { colors, palette, light, dark } from '@/theme/colors';
export type { ColorKey, ThemeTokens } from '@/theme/colors';
