/**
 * Compatibility shim — was the rich design-token file.
 * Now re-exports from the unified theme source (src/theme/tokens) so any
 * file importing `@/core/theme/tokens` or `@/core/theme` keeps working.
 */
export {
  typography,
  chatTypography,
  spacing,
  borderRadius,
  shadows,
  motion,
  chat,
  zIndex,
  opacity,
} from '@/theme/tokens';

export { default } from '@/theme/tokens';
