/**
 * Jouspace — Dark Theme Tokens (DEEP INDIGO NIGHT)
 *
 * Base #1a1327 (no pure black). Indigo undertones throughout.
 * Brand #7d66de glows on the dark base; on-brand text uses the dark base.
 * Contrast tuned for WCAG AA.
 */

import type { ThemeTokens } from './light';

export const darkTheme: ThemeTokens = {
  background: {
    primary: '#0F0F0F',
    secondary: '#1A1A1A',
    tertiary: '#242424',
    elevated: '#1A1A1A',
  },
  surface: {
    primary: '#1A1A1A',
    secondary: '#242424',
    tertiary: '#2E2E2E',
    card: '#1F1F1F',
    elevated: '#242424',
    warm: '#211A2E',
  },
  text: {
    primary: '#F3EEFB',
    secondary: '#C9BCDD',
    tertiary: '#9A8CB4',
    inverse: '#1A1327',
    disabled: '#6E6288',
    muted: '#8A7CA8',
  },
  border: {
    subtle: 'rgba(107, 84, 200, 0.08)',
    default: 'rgba(107, 84, 200, 0.16)',
    strong: 'rgba(107, 84, 200, 0.28)',
    focus: '#b692f6',
  },
  glass: {
    highlight: 'rgba(255, 255, 255, 0.10)',
    light: 'rgba(255, 255, 255, 0.70)',
    medium: 'rgba(107, 84, 200, 0.18)',
    strong: 'rgba(107, 84, 200, 0.28)',
    tint: 'rgba(107, 84, 200, 0.10)',
    border: 'rgba(107, 84, 200, 0.30)',
  },
  brand: {
    primary: '#6B54C8',
    primaryDeep: '#503EA0',
    secondary: '#8D72E6',
    tertiary: '#B8A9D7',
    onPrimary: '#171122',
    /** Backward-compatible alias for onPrimary (used by many components). */
    contrastText: '#171122',
    subtle: 'rgba(107, 84, 200, 0.16)',
    border: 'rgba(107, 84, 200, 0.45)',
    onPrimaryMuted: 'rgba(255, 255, 255, 0.7)',
    onPrimarySubtle: 'rgba(255, 255, 255, 0.6)',
    onPrimaryFaint: 'rgba(255, 255, 255, 0.15)',
    onPrimaryGhost: 'rgba(255, 255, 255, 0.1)',
    onPrimaryDivider: 'rgba(255, 255, 255, 0.2)',
    tint: 'rgba(109, 79, 215, 0.18)',
  },
  overlay: {
    light: 'rgba(26, 19, 39, 0.45)',
    medium: 'rgba(26, 19, 39, 0.62)',
    strong: 'rgba(26, 19, 39, 0.78)',
    backdrop: 'rgba(26, 19, 39, 0.55)',
  },
  success: '#4FD08A',
  warning: '#F4C95B',
  danger: '#F58BA1',
  info: '#6FB6E8',
  successSubtle: 'rgba(79, 208, 138, 0.14)',
  warningSubtle: 'rgba(244, 201, 91, 0.14)',
  dangerSubtle: 'rgba(245, 139, 161, 0.14)',
  infoSubtle: 'rgba(111, 182, 232, 0.14)',
  successText: '#9FE7C2',
  warningText: '#FBE3A0',
  dangerText: '#FBC3D0',
  infoText: '#BFE0F6',
  mood: {
    calm: '#7CC0E0',
    good: '#74C9A8',
    great: '#B99BE8',
    notGood: '#E7A982',
    overwhelmed: '#E0A0B8',
    happy: '#F0C96E',
    sad: '#93B0E6',
    anxious: '#E0B0D0',
    grateful: '#A6D8B0',
    reflective: '#B0A2E8',
    energized: '#E8B084',
  },
  moodScale: {
    1: '#E0A0B8',
    2: '#E7A982',
    3: '#9AAAB8',
    4: '#B99BE8',
    5: '#74C9A8',
  },
};
