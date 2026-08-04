/**
 * Jouspace — Light Theme Tokens (PRIMARY THEME)
 *
 * Quiet warm journal base. Background wash #FBF9F5, brand accent #6D4FD7.
 * `primary` (#6D4FD7) is used for fills; `primaryDeep` (#5A3FC0) is used
 * wherever brand color sits under text/icon on a light surface (AA-safe).
 * Contrast tuned for WCAG AA on every text/surface pairing.
 */

export interface ThemeTokens {
  background: { primary: string; secondary: string; tertiary: string; elevated: string };
  surface: { primary: string; secondary: string; tertiary: string; card: string; elevated: string; warm: string };
  text: { primary: string; secondary: string; tertiary: string; inverse: string; disabled: string; muted: string };
  border: { subtle: string; default: string; strong: string; focus: string };
  glass: { highlight: string; light: string; medium: string; strong: string; tint: string; border: string };
  brand: {
    primary: string;        // decorative / gradient fill
    primaryDeep: string;    // icons + text on light surfaces
    secondary: string;
    tertiary: string;
    onPrimary: string;       // text drawn on brand fills
    /** Backward-compatible alias for onPrimary (used by many components). */
    contrastText: string;
    subtle: string;          // tinted fill behind brand chips
    border: string;          // brand outline tint
    onPrimaryMuted: string;    // rgba(255,255,255,0.7) — subtitle text on brand
    onPrimarySubtle: string;   // rgba(255,255,255,0.6) — eyebrow text on brand
    onPrimaryFaint: string;    // rgba(255,255,255,0.15) — badge/icon-circle bg on brand
    onPrimaryGhost: string;     // rgba(255,255,255,0.1) — border on brand
    onPrimaryDivider: string;   // rgba(255,255,255,0.2) — divider line on brand
    tint: string;               // solid soft lavender fill behind chips/avatars
  };
  overlay: { light: string; medium: string; strong: string; backdrop: string };
  success: string; warning: string; danger: string; info: string;
  successSubtle: string; warningSubtle: string; dangerSubtle: string; infoSubtle: string;
  successText: string; warningText: string; dangerText: string; infoText: string;
  mood: {
    calm: string; good: string; great: string; notGood: string; overwhelmed: string;
    happy: string; sad: string; anxious: string; grateful: string; reflective: string; energized: string;
  };
  moodScale: {
    1: string; 2: string; 3: string; 4: string; 5: string;
  };
}

export const lightTheme: ThemeTokens = {
  background: {
    primary: '#FBF9F5',
    secondary: '#FCFAF7',
    tertiary: '#F5F2EC',
    elevated: '#FFFFFF',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#FCFAF7',
    tertiary: '#F5F2EC',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    warm: '#FFFEFC',
  },
  text: {
    primary: '#0D102B',
    secondary: '#68677E',
    tertiary: '#8B8998',
    inverse: '#FFFFFF',
    disabled: '#B8B5C4',
    muted: '#8B8998',
  },
  border: {
    subtle: '#E9E4E0',
    default: '#E7E1EF',
    strong: '#D8D0E8',
    focus: '#9B8AD9',
  },
  glass: {
    highlight: 'rgba(255, 255, 255, 0.65)',
    light: 'rgba(255, 255, 255, 0.72)',
    medium: 'rgba(251, 249, 245, 0.55)',
    strong: 'rgba(251, 249, 245, 0.80)',
    tint: 'rgba(109, 79, 215, 0.10)',
    border: 'rgba(109, 79, 215, 0.35)',
  },
  brand: {
    primary: '#6D4FD7',
    primaryDeep: '#5A3FC0',
    secondary: '#8D72E6',
    tertiary: '#B8A9D7',
    onPrimary: '#FFFFFF',
    /** Backward-compatible alias for onPrimary (used by many components). */
    contrastText: '#FFFFFF',
    subtle: 'rgba(109, 79, 215, 0.12)',
    border: 'rgba(109, 79, 215, 0.40)',
    onPrimaryMuted: 'rgba(255, 255, 255, 0.7)',
    onPrimarySubtle: 'rgba(255, 255, 255, 0.6)',
    onPrimaryFaint: 'rgba(255, 255, 255, 0.15)',
    onPrimaryGhost: 'rgba(255, 255, 255, 0.1)',
    onPrimaryDivider: 'rgba(255, 255, 255, 0.2)',
    tint: '#F0ECFF',
  },
  overlay: {
    light: 'rgba(13, 16, 43, 0.25)',
    medium: 'rgba(13, 16, 43, 0.45)',
    strong: 'rgba(13, 16, 43, 0.62)',
    backdrop: 'rgba(251, 249, 245, 0.60)',
  },
  success: '#1F8A4D',
  warning: '#9A6512',
  danger: '#C12A4B',
  info: '#1F6FB0',
  successSubtle: 'rgba(31, 138, 77, 0.12)',
  warningSubtle: 'rgba(154, 101, 18, 0.12)',
  dangerSubtle: 'rgba(193, 42, 75, 0.12)',
  infoSubtle: 'rgba(31, 111, 176, 0.12)',
  successText: '#166B3A',
  warningText: '#7A4E0C',
  dangerText: '#9B1F3C',
  infoText: '#155A93',
  mood: {
    calm: '#5BA3C9',
    good: '#4FAE8B',
    great: '#9A78D0',
    notGood: '#D98A5B',
    overwhelmed: '#C76B8E',
    happy: '#E0A93B',
    sad: '#6B8FD6',
    anxious: '#C98AB0',
    grateful: '#7FB98A',
    reflective: '#8A7BD0',
    energized: '#D98C5B',
  },
  moodScale: {
    1: '#C76B8E',
    2: '#D98A5B',
    3: '#7E8E9F',
    4: '#9A78D0',
    5: '#4FAE8B',
  },
};
