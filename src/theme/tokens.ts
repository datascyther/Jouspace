/**
 * Jouspace Design System — Unified Design Tokens
 *
 * Consolidated source of truth (merged from the former src/core/theme/tokens.ts).
 * Semantic color themes live in light.ts / dark.ts. Non-color design tokens
 * (typography, spacing, radius, shadows, gradients, motion, chat) live here.
 * All components must reference these tokens — never hardcode values.
 *
 * Typography: editorial journal system — Lora (display/headings) + Inter (body/UI).
 */

export const typography = {
  fontFamily: {
    sans: 'Inter, sans-serif',
    display: 'Lora, serif',
    mono: 'JetBrains Mono',
  },
  fontSize: {
    hero: 56,
    'page-title': 38,
    'section-title': 30,
    'card-title': 21,
    'body-lg': 18,
    body: 16,
    'body-md': 15,
    'body-l': 17,
    'body-sm': 14,
    caption: 13,
    label: 12,
    xsm: 10,
  },
  lineHeight: {
    hero: 1.1,
    'page-title': 1.2,
    'section-title': 1.25,
    'card-title': 1.35,
    'body-lg': 1.5,
    body: 1.5,
    'body-sm': 1.5,
    caption: 1.45,
    label: 1.4,
    'body-md': 1.5,
    'body-l': 1.4,
  },
  fontWeight: {
    hero: '700' as const,
    'page-title': '500' as const,
    'section-title': '600' as const,
    'card-title': '600' as const,
    'body-lg': '400' as const,
    body: '400' as const,
    'body-sm': '400' as const,
    caption: '400' as const,
    label: '500' as const,
    'body-md': '500' as const,
    'body-l': '600' as const,
  },
  letterSpacing: {
    hero: -0.03,
    'page-title': -0.01,
    'section-title': -0.01,
  },
  /** Backward-compatible component-style aliases (formerly src/theme/tokens.ts). */
  textPrimary: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  textSecondary: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  headingLarge: { fontSize: 32, fontWeight: '800' as const, lineHeight: 38 },
  headingMedium: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  titleLarge: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  captionSmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 20 },
  buttonPrimary: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  buttonSecondary: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
} as const;

/**
 * Typography system for the chat conversation.
 * Defines every text style used in messages — headings, body, supporting,
 * lists, quotes, code, links, emojis, and block labels.
 */
export const chatTypography = {
  /** AI message body — comfortable reading */
  bodyAI: { fontSize: 16, lineHeight: 26, fontWeight: '400' as const },
  /** User message body */
  bodyUser: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  /** Heading level 1 — section titles within messages */
  h1: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  /** Heading level 2 */
  h2: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  /** Heading level 3 */
  h3: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  /** Supporting / caption text — timestamps, footnotes */
  supporting: { fontSize: 13, lineHeight: 19, fontWeight: '400' as const },
  /** Block type label (e.g. "Reflection", "Question") */
  blockLabel: {
    fontSize: 11, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  /** Inline code and code blocks */
  code: { fontSize: 13, lineHeight: 20, fontWeight: '400' as const, fontFamily: 'JetBrains Mono' as const },
  /** List item body */
  listItem: { fontSize: 15, lineHeight: 24, fontWeight: '400' as const },
  /** Blockquote text */
  quote: { fontSize: 15, lineHeight: 23, fontWeight: '400' as const, fontStyle: 'italic' as const },
  /** Link text */
  link: { fontSize: 16, lineHeight: 26, fontWeight: '500' as const, textDecorationLine: 'underline' as const },
  /** Emoji-only line */
  emoji: { fontSize: 22, lineHeight: 32, fontWeight: '400' as const, textAlign: 'center' as const },
  /** Reflection / insight title */
  reflectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
} as const;

export const spacing = {
  '2xs': 2,
  '1.5xs': 3,
  xs: 4,
  'xs-sm': 6,
  sm: 8,
  '2.5sm': 10,
  md: 12,
  '1.5md': 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  /** Backward-compatible alias for 2xl. */
  xxl: 28,
  '3xl': 32,
  '4xl': 48,
  section: 40,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
  '8xl': 120,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  'sm-md': 10,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
  glass: 16,
  'glass-sm': 12,
  'glass-lg': 24,
} as const;

/**
 * Shadows use a INDIGO TINT (never pure black) to match the companion
 * aesthetic and keep surfaces soft / non-alarming.
 */
export const shadows = {
  sm: {
    shadowColor: '#7D66DE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#7D66DE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#7D66DE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },
  glass: {
    shadowColor: '#7D66DE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const motion = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: [0.4, 0, 0.2, 1] as const,
    easeOut: [0, 0, 0.2, 1] as const,
    easeIn: [0.4, 0, 1, 1] as const,
    spring: { damping: 15, stiffness: 200, mass: 1 } as const,
    springLight: { damping: 18, stiffness: 180, mass: 0.8 } as const,
    springBouncy: { damping: 10, stiffness: 250, mass: 0.6 } as const,
  },
} as const;

/**
 * Chat-specific design tokens.
 * These define the geometry and visual grammar of the conversation.
 */
export const chat = {
  bubble: {
    /** Standard corner radius for all bubbles */
    radius: 20,
    /** Flattened corner radius for grouped same-role siblings */
    radiusGrouped: 6,
    /** Top corner radius for first message in a user group */
    radiusTop: 20,
    /** Bottom corner radius for last message in a user group */
    radiusBottom: 20,
    /** Max width for AI bubbles (full-width card) */
    maxWidthAI: '100%' as const,
    /** Max width for user bubbles */
    maxWidthUser: '82%' as const,
    /** Padding inside AI card bubbles */
    paddingHAI: 20,
    paddingVAI: 18,
    /** Padding inside user pill bubbles */
    paddingHUser: 16,
    paddingVUser: 10,
  },
  group: {
    /** Vertical gap between messages in the same group */
    innerGap: 2,
    /** Vertical gap between groups (different roles) */
    outerGap: 12,
  },
  typography: chatTypography,
  blocks: {
    /** Accent colors per block type — derived from the indigo mood ramp. */
    reflection: '#8D72E6',
    question: '#7D66DE',
    action: '#4FAE8B',
    summary: '#E0A93B',
    insight: '#A894E8',
    resource: '#6B54C8',
  },
} as const;

export const zIndex = {
  base: 0,
  elevated: 10,
  dropdown: 100,
  modal: 200,
  overlay: 300,
  toast: 400,
  tooltip: 500,
} as const;

export const opacity = {
  disabled: 0.4,
  high: 0.9,
  full: 1,
} as const;

export default {
  typography,
  chatTypography,
  spacing,
  borderRadius,
  shadows,
  motion,
  chat,
  zIndex,
  opacity,
};
