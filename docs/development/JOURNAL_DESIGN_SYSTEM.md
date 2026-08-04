# Journal — Design System

> Phase 2 · Journal Product Architecture · Step 5
> Status: Draft for lock-in · Depends on: JOURNAL_FOUNDATION.md, JOURNAL_UI_ARCHITECTURE.md

This document locks the **visual language** of Reflection. It reuses the existing
Jouspace design system (glassmorphism, Geomini type, jouspace palette) and specifies the
Reflection-specific rules for Layout, Cards, Timeline, Journal cards, Memory cards,
Empty states, Motion, Typography, Colors, and Spacing. All tokens reference real values
from `tailwind.config.js`, `src/theme/*`, and `src/shared/components/GlassCard.tsx`.

---

## 1. Layout

- **Root container:** `ScreenContainer` with `SafeAreaView` top inset; background uses
  `colors.background.primary` (token `--background-primary`).
- **Max content width:** unbounded on mobile; centered column, horizontal padding
  `16–24px` (`p-4`/`p-6`).
- **Vertical rhythm:** stacked sections with `12–16px` gaps; section separation via
  `SectionHeader` + `16–24px` margin, not dividers.
- **Bottom nav constant:** the Reflection tab bar is always visible; in-feature screens
  are stack pushes that keep it as the home anchor.
- **Background motion:** a subtle aurora (`AuroraBackground`) behind content, matching
  Home — calm, slow, non-distracting. No celebratory bursts.

---

## 2. Cards (base: `GlassCard`)

Reflection's primary surface is the **frosted GlassCard**.

| Prop | Reflection usage |
|------|-----------------|
| `intensity` | `dark` default; `medium` for nested/secondary cards; `light` rarely |
| `themeColor` | brand tint for glow. **Purple** for journal/favorite cards; **Cyan** for AI/Memory/Insight cards (signals "AI-associated") |
| `className` radius | `rounded-glass-lg` (24px) for hero cards; `rounded-glass` (16px) for rows; `rounded-glass-sm` (12px) for chips |
| `onPress` | pressable rows (Timeline/Search/Favorites) navigate to Detail |

- Border: 1px gradient stroke (light top → fade bottom), rendered via SVG in `GlassCard`.
- Shadow: `shadows.glass` (soft, low-opacity, brand-tinted when `themeColor` set).
- No scale/jiggle on press (per `GlassCard` — pressable uses `onPress` directly).

---

## 3. Timeline Style

- **Structure:** vertical chronological list, newest first, grouped by date headers.
- **Date headers:** `SectionHeader` ("Today", "Yesterday", "This week", or
  "July 2026") in `caption`/`label` weight, `text.secondary`.
- **Spine (optional, subtle):** a 1px vertical line `border.default` color behind cards
  on wider screens; omitted on mobile to stay calm.
- **Entry rows:** GlassCard `rounded-glass`, `intensity="medium"`, with date (caption),
  title-or-snippet (card-title / body), and an optional mood chip.
- **Pagination:** footer `LoadingSpinner` / `SkeletonLoader` rows; no "load more" button
  pressure — infinite scroll only.

---

## 4. Journal Cards

Used in Hub (recent), Timeline, Search, Favorites.

**Anatomy**
- **Title** — `card-title` (20px/600). Falls back to first line of body when title empty
  (blank title is valid, NG5).
- **Snippet** — `body` (16px/400), 2-line clamp (`line-clamp-2`), `text.secondary`.
- **Meta row** — date in `caption` (`text.secondary`) + optional mood chip (right).
- **Accent** — `themeColor={jouspace.purple.500}` glow; `rounded-glass`.

**Variants**
- *Recent (Hub)* — `rounded-glass-lg`, `intensity="dark"`, 3–5 items.
- *Row (Timeline/Search/Favorites)* — `rounded-glass`, `intensity="medium"`, pressable.
- *Favorite* — adds a star `IconButton` (top-right) in brand purple.

---

## 5. Memory Cards [PLANNED]

User-facing surface over the AI long-term memory (`mem-<uid>`). Visually distinct so
users instantly read "this is what the Companion remembers."

**Anatomy**
- **Cyan accent** — `themeColor={jouspace.cyan.400}` glow (AI association).
- **Snippet** — the remembered text, `body`, 2–3 line clamp.
- **Source ref** — `caption` "From your reflection on <date>" (links to Detail).
- **Forget action** — `IconButton` (trash/eye-off) top-right → removes memory.
- **Container** — `rounded-glass`, `intensity="medium"`.

**Tone:** calm, transparent. A small "AI" glyph or label may sit by the title to signal
provenance without alarm.

---

## 6. Empty States

Reflection's empty states are **welcoming, never guilt-inducing** (P4). Centered,
single-column, glass or plain.

| Screen | Copy tone | Element |
|--------|-----------|---------|
| Hub (first-time) | "A space for your thoughts." | quill glyph + pre-expanded composer |
| Timeline | "No reflections yet — start with today's thought." | `EmptyState` + write CTA |
| Memories | "Nothing remembered yet." + privacy note | `EmptyState` |
| AI Insights | "Write a few reflections to see themes." (no pressure) | `EmptyState` |
| Favorites | "Tap the star on any reflection to save it here." | `EmptyState` |
| Search (no results) | "No reflections match '<query>'." | `EmptyState` |

- No streaks, no "you're behind", no red/warning color for emptiness.
- Icon: `RiQuillPenAiFill` (the nav quill) for Reflection-owned empties.

---

## 7. Motion

Reflection motion is **soft, purposeful, non-playful** — it aids calm, never rewards.

- **Library:** `react-native-reanimated` (`useSharedValue`, `withSpring`, `withTiming`,
  `useAnimatedStyle`) — consistent with Home.
- **Save button (Hub/editor):** fade + `translateY` (8→0) via `withSpring`
  (`SPRING_CONFIG`), triggered by composed-text presence; button **stays mounted**
  (pointerEvents toggle, never `display:none`/`null`) to avoid the Fabric responder break.
- **Card enter:** opacity 0→1 + `translateY` 8→0 `withSpring`, staggered slightly on list load.
- **Sheet/Modal:** `BottomSheet` (edit) and `Modal` (delete confirm) use standard
  platform transitions; no custom bounce.
- **Background:** aurora drifts via long `withTiming` (≈24s, `Easing.inOut`) — slow, ambient.
- **Forbidden:** streak celebrations, confetti, scale jiggle, haptic-on-every-action
  (light haptic only on tab press, per `BottomNavigation`).

---

## 8. Typography

Font: **Geomini** (display + sans). Scale from `tailwind.config.js`:

| Token | Size / weight | Reflection usage |
|-------|--------------|------------------|
| `hero` (56/700) | big moments only — Weekly Review title |
| `page-title` (40/700) | (unused; nav uses tab label) |
| `section-title` (28/600) | screen headers (Hub, Timeline, Memories) |
| `card-title` (20/600) | journal/memory card titles |
| `body-lg` (18/400) | editor body, insight text |
| `body` (16/400) | snippets, detail body |
| `body-sm` (14/400) | secondary text |
| `caption` (13/400) | dates, meta |
| `label` (12/500) | chips, hints |

- Line-height generous (1.6–1.7) for comfortable reading of personal writing.
- Letter-spacing tight (-0.015 to -0.03em) on large headings only.

---

## 9. Colors

| Role | Token / value | Use |
|------|---------------|-----|
| Background | `background.primary` (`--background-primary`) | screen bg |
| Surface | `surface.card` / `surface.primary` | GlassCard fills |
| Text primary | `text.primary` | titles, body |
| Text secondary | `text.secondary` | snippets, meta, headers |
| Text disabled | `text.disabled` (`#6B7280` dark / `#94A3B8` light) | inactive |
| **Brand (journal/favorite)** | `brand.primary` + `jouspace.purple.500` `#8B5CF6` / `.600` `#7C3AED` | active tab, journal glow, save |
| **AI accent (memory/insight)** | `jouspace.cyan.400` `#22D3EE` / `.500` `#06B6D4` | memory/insight glow, AI glyph |
| Mood chips | emotion tokens (`emotionConfig`) | linked mood |
| Danger | `danger` (`--danger`) | delete confirm only |
| Success | `success` (`--success`) | "Saved ✓" toast |

- Dark/light both supported via CSS-var tokens; no hardcoded hex in components (use
  `useTheme()` / Tailwind classes).
- Contrast tuned to WCAG AA (per `src/theme/{light,dark}.ts`).

---

## 10. Spacing

Base scale (4px unit), from `tailwind.config.js` + `spacing` tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `1` | 4px | icon-to-text gaps |
| `2` | 8px | chip inner padding, tight gaps |
| `3` | 12px | card inner gaps, section gaps |
| `4` | 16px | screen horizontal padding (`p-4`), card padding |
| `5` | 20px | — |
| `6` | 24px | `p-6` generous padding, section separation |
| `safe-*` | env safe-area insets | top/bottom screen padding |

- Card padding: `p-5` (GlassCard default) for hero; `p-4` for rows.
- Inter-card gap: `12px` (Timeline/Search lists), `16px` (Hub sections).
- Touch targets: ≥44×44px for `IconButton`/rows (a11y).

---

## Lock Statement

Reflection's visual language is the Jouspace glass system with two accents — **purple**
for user-authored content (journal/favorites) and **cyan** for AI-associated surfaces
(memory/insights). Motion is soft and mounted-safe; empty states are welcoming; spacing
and type follow the established Geomini scale. Any new color, radius, or motion pattern
requires re-locking this document.
