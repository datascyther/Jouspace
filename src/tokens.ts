// Jouspace Design System Tokens
// Source of Truth - Do not introduce additional colors or arbitrary spacing.

export const COLORS = {
  background: '#FBF9F5',
  surface: '#FFFEFC',
  primaryText: '#0D102B',
  secondaryText: '#68677E',
  muted: '#8B8998',
  accent: '#6D4FD7',
  accentSoft: '#F0ECFF',
  border: '#E7E1EF',
  divider: '#E9E4E0',
} as const;

export const SPACING = {
  screenPadding: 16, // px
  sectionGap: 28, // px
  cardPadding: 24, // px
  cardRadius: 24, // px
  rowHeight: 60, // px
  bottomNavHeight: 60, // px
  floatingButton: 52, // px
} as const;

export const FONTS = {
  editorial: "'Lora', Georgia, serif",
  body: "'Inter', -apple-system, sans-serif",
} as const;
