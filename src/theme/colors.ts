/**
 * Jouspace Design System — Color Palette
 *
 * `light` / `dark` are the semantic ThemeTokens used by ThemeProvider and
 * Tailwind. `palette` holds the raw brand ramps (purple / cyan / glass /
 * surface / status) referenced by a few feature files for fine-grained
 * accent work. All ramps are derived from the indigo brand system.
 *
 * Dark theme is no longer the default — light is the primary theme.
 */

export { lightTheme as light } from './light';
export { darkTheme as dark } from './dark';
export type { ThemeTokens } from './light';

import { lightTheme } from './light';
import { darkTheme } from './dark';

/** Raw brand ramps (fine-grained accents). */
export const palette = {
  purple: {
    50: '#F0EDFE',
    100: '#E0DBFC',
    200: '#C4B9F8',
    300: '#A894F0',
    400: '#8D72E6',
    500: '#7D66DE',
    600: '#6B54C8',
    700: '#5A43B2',
    800: '#48339C',
    900: '#362386',
  },
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    medium: 'rgba(246, 243, 255, 0.55)',
    dark: 'rgba(26, 19, 39, 0.7)',
    border: 'rgba(125, 102, 222, 0.30)',
    highlight: 'rgba(125, 102, 222, 0.10)',
  },
  surface: {
    dark: '#1A1327',
    light: '#F6F3FF',
    card: '#2A1F40',
    elevated: '#322447',
  },
  text: {
    primary: '#2A1B47',
    secondary: '#4A3A6B',
    tertiary: '#6E5F8E',
    accent: '#8D72E6',
    link: '#1F6FB0',
  },
  status: {
    success: '#1F8A4D',
    warning: '#9A6512',
    error: '#C12A4B',
    info: '#1F6FB0',
  },
} as const;

export const colors = {
  light: lightTheme,
  dark: darkTheme,
  /** Backward-compatible ramps (formerly core/theme/colors.ts). */
  purple: palette.purple,
  cyan: palette.cyan,
} as const;

export type ColorKey = keyof typeof colors;
