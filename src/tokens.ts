// Jouspace Design System Tokens
// Source of Truth - Do not introduce additional colors or arbitrary spacing.
// Mirrors the CSS custom properties defined in src/theme.css.

export const COLORS = {
  background: '#F7F6F3', // --bg-canvas
  surface: '#FFFFFF', // --bg-card
  primaryText: '#1A1A1A', // --text-primary
  secondaryText: '#6B6B6B', // --text-secondary
  muted: '#9B9B9B', // --text-muted
  accent: '#6C4DCA', // --accent-purple
  accentHover: '#5A3EB0',
  accentActive: '#4A318F',
  accentAlt: '#5E40C0',
  accentSoft: '#F1ECFB', // --accent-purple-light
  border: '#ECEAE6',
  divider: '#EFEDEA',
  avatarBg: '#F1EFF8',
  inputBg: '#F4F3F0',
  error: '#C53030',
  errorBg: '#FDECEC',
  errorBorder: '#F5C6C6',
} as const;

export const SPACING = {
  screenPadding: 16, // px
  sectionGap: 28, // px
  cardPadding: 24, // px
  cardRadius: 16, // px (--radius-card)
  rowHeight: 60, // px
  bottomNavHeight: 80, // px (includes safe area)
  floatingButton: 56, // px
} as const;

export const FONTS = {
  editorial: "'Playfair Display', Georgia, serif", // --font-serif
  body: "'Inter', -apple-system, sans-serif", // --font-sans
} as const;

export const RADII = {
  card: 16, // px
  button: 12, // px
  pill: 9999, // px
} as const;
