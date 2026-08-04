# Jouspace Emotion System

A custom, premium, animated, brand-consistent replacement for all Unicode emojis in the Jouspace app.

---

## 1. Overview / Goal

The Jouspace Emotion System replaces every default Unicode emoji in the production UI with a single, reusable, custom-designed component: **`EmotionAvatar`**.

**Why:** Generic platform emojis (Apple/Google/WhatsApp) break brand consistency, render differently per OS, and clash with the calm, premium Jouspace aesthetic. A single source of truth makes the app feel intentional and cohesive across Light and Dark mode.

**Success criteria**

| Criterion | Definition |
| --- | --- |
| Zero Unicode emojis | No emoji glyphs remain in production UI (`*.tsx` screens/components). |
| One component | Every mood/state visual is rendered by `EmotionAvatar`. |
| 60 FPS | All idle animations run on the UI thread via `react-native-reanimated`. |
| Light & Dark | Every asset/animation adapts to the active theme through `useTheme()`. |

**Status:** Design (Phase 1) → Assets (Phase 2) → Motion (Phase 3) → Component (Phase 4) → Migration.

---

## 2. Design Language (Phase 1)

One visual language, applied uniformly to all five emotions.

**Avoid**

- Apple / Google / WhatsApp emoji styles
- Cartoon faces, exaggerated expressions
- Neon RGB "gaming" palettes
- Bundled emoji PNG packs

**Target aesthetic**

- Soft, multi-stop gradients
- Rounded geometry (orbs, no hard edges)
- Thin, expressive facial features (not bold cartoon strokes)
- Calm, restrained personality
- Ambient glow that lifts the orb off the surface
- Minimal detail — fewer elements, more breathing room

---

## 3. Color System

Each emotion has a two-stop gradient plus a low-opacity glow.

| Emotion | Primary | Secondary | Glow opacity |
| --- | --- | --- | --- |
| Great | Warm Gold | Soft Orange | 8–15% |
| Good | Lavender | Violet | 8–15% |
| Calm | Sky Blue | Cyan | 8–15% |
| Not Good | Slate Blue | Indigo | 8–15% |
| Overwhelmed | Coral | Muted Purple | 8–15% |

> Suggested hex (starting point, tune for WCAG AA contrast on `colors.surface`):
> Great `#F4C36B → #F2A35E`, Good `#C4B5FD → #8B5CF6`, Calm `#7DD3FC → #22D3EE`,
> Not Good `#64748B → #4F46E5`, Overwhelmed `#FB7185 → #A78BFA`.

---

## 4. Illustration Rules

Every illustration MUST contain all of the following. Order = render stack (back to front).

1. **Circular container** — fixed aspect ratio, equal width/height.
2. **Soft gradient** — two-stop radial/linear gradient fills the orb.
3. **Ambient glow** — blurred halo at 8–15% opacity, behind the orb.
4. **Minimal face** — thin eyes, small mouth, no heavy outlines.
5. **Soft shadow** — subtle drop shadow grounding the orb.
6. **Highlight** — small specular spot for depth.

**Structure (back → front):**

```
Gradient Orb → Minimal Face → Glow Layer → Soft Shadow → Highlight
```

Consistent proportions across all five: orb fills ~78% of the container; eyes sit at ~42% height; mouth centered at ~62% height.

---

## 5. Assets (Phase 2)

Place vector assets at:

```
src/shared/assets/emotion-system/
├── great.svg
├── good.svg
├── calm.svg
├── not-good.svg
└── overwhelmed.svg
```

> **Note on path:** The spec referenced `assets/emotion-system/`. The repo convention keeps shared assets under `src/shared/assets/` (see `src/shared/assets/jouspace-logo.jpg`, `icon.png`, etc.), so assets live there. Adjust the import in `EmotionAvatar` if a different convention is adopted.

**Required SVG composition for each file**

| Layer | Element | Notes |
| --- | --- | --- |
| `<defs>` gradient | `linearGradient` / `radialGradient` | Two stops from Color System (§3). |
| Orb | `<circle>` filled with gradient | Radius ≈ 78% of viewBox, smooth corners. |
| Glow | `<circle>` / `<filter blur>` | Opacity 8–15%, behind orb. |
| Eyes | Two thin `<line>` or `<ellipse>` | Calm, symmetric, ~42% height. |
| Mouth | Small `<path>` | Subtle curve; varies slightly per emotion. |
| Shadow | `<filter>` drop-shadow | Soft, low alpha. |
| Highlight | Small `<circle>` | White, low opacity, upper-left. |

Example skeleton (per emotion, swap colors + mouth path):

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="orb" cx="50%" cy="40%">
      <stop offset="0%" stop-color="PRIMARY"/>
      <stop offset="100%" stop-color="SECONDARY"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <circle cx="50" cy="50" r="40" fill="url(#orb)" filter="url(#glow)" opacity="0.12"/>
  <circle cx="50" cy="50" r="39" fill="url(#orb)"/>
  <line x1="38" y1="42" x2="44" y2="42" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <line x1="56" y1="42" x2="62" y2="42" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <path d="M40 60 Q50 66 60 60" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="38" cy="34" r="6" fill="#fff" opacity="0.25"/>
</svg>
```

---

## 6. Motion System (Phase 3)

Idle animations per emotion. All driven by `react-native-reanimated` (`useSharedValue` + `withRepeat`/`withTiming`) so they run at 60 FPS on the UI thread.

| Emotion | Animation | Values | Duration |
| --- | --- | --- | --- |
| Great | Slow pulse | scale `1.00 → 1.03 → 1.00` | 2800 ms |
| Good | Small float | translateY `2px → 0px → 2px` | 3200 ms |
| Calm | Breathing glow | glow opacity `0.85 → 1.00 → 0.85` | 4000 ms |
| Not Good | Tiny sway | rotate `-2° → 2° → 0°` | 3600 ms |
| Overwhelmed | Soft wobble | micro shake + return (subtle) | 2600 ms |

All loops are infinite and `easing: Easing.inOut(Easing.sin)` unless noted. Animations are disabled when `animated={false}` or `disabled={true}`.

---

## 7. Reusable Component: `EmotionAvatar.tsx` (Phase 4)

**Location:** `src/shared/components/EmotionAvatar.tsx` (recommended, alongside other shared components such as `Avatar.tsx`, `Badge.tsx`).

**Props**

| Prop | Type | Purpose |
| --- | --- | --- |
| `emotion` | `EmotionType` | Which emotion to render. |
| `size` | `number` | Width/height in dp (square). |
| `animated` | `boolean` | Enable idle animation (default `true`). |
| `selected` | `boolean` | Selection-state styling (ring/scale). |
| `disabled` | `boolean` | Disabled state (dimmed, no animation). |
| `showLabel` | `boolean` | Render emotion label text below the orb. |
| `showGlow` | `boolean` | Toggle the ambient glow layer. |

**Responsibilities**

- Render the correct SVG asset for `emotion`.
- Apply the matching idle animation from §6 when `animated` (and not `disabled`).
- Consume `useTheme()` for Light/Dark adaptation (see §8).
- Provide accessibility via `accessibilityRole="image"` and `accessibilityLabel={label}`.
- Trigger haptic feedback (`expo-haptics`) on press/selection.
- Reflect `selected` and `disabled` states in styling.

**Usage example**

```tsx
import { EmotionAvatar } from '@/shared/components/EmotionAvatar';
import { useTheme } from '@/hooks/useTheme';

function MoodPicker({ selectedMood, onSelect }: Props) {
  const { colors } = useTheme();
  return (
    <EmotionAvatar
      emotion={selectedMood}
      size={64}
      animated
      selected={true}
      showLabel
      showGlow
    />
  );
}
```

---

## 8. Theming

`EmotionAvatar` consumes the existing theme system — no new provider required.

```tsx
import { useTheme } from '@/hooks/useTheme'; // src/hooks/useTheme.ts
const { colors, isDark, mode, theme } = useTheme();
```

`useTheme()` returns the `ThemeContext` (`src/providers/ThemeProvider.tsx`). The relevant tokens (verified in `src/theme/light.ts`) are:

| Token | Used for |
| --- | --- |
| `colors.brand.primary` | Selection ring / accent |
| `colors.brand.contrastText` | Label text on brand fill |
| `colors.surface.secondary` | Container behind the avatar |
| `colors.text.secondary` | Label text |
| `colors.border.default` | Divider / subtle outline |

**Light vs Dark**

- The glow and gradient are tuned so contrast holds on both `colors.surface.primary` and `colors.surface.secondary`.
- In Dark mode, increase glow opacity toward the top of the 8–15% range and lighten gradient stops slightly for visible ambient lift.
- Drive the `isDark` flag from `useTheme()` rather than reading `Appearance` directly, keeping the avatar consistent with the rest of the app.

---

## 9. Migration Guide

Goal: remove every Unicode emoji from production UI and route all mood visuals through `EmotionAvatar`.

### Step 0 — Confirm current emoji usage

Emoji glyphs currently appear in these files (verified via grep):

| File | Line | Usage |
| --- | --- | --- |
| `src/features/home/screens/HomeScreen.tsx` | 327 | `"You reflected today ✨"` |
| `src/features/home/screens/HomeScreen.tsx` | 424 | `MOOD_MAP[selectedMood].emoji` |
| `src/features/home/components/WeeklyHistoryCard.tsx` | 99 | `MOOD_MAP[rating].emoji` |
| `src/features/home/components/MoodSnapshotCard.tsx` | 7 | `getMoodEmoji` / `getMoodLabel` |
| `src/features/home/components/MoodSelector.tsx` | 21–22 | `MOOD_MAP[value].emoji` + `label` |

### Step 1 — Add the `emotion` enum to types

In `src/shared/types/index.ts`, add an `EmotionType` and deprecate the `emoji` field on `MOOD_MAP`:

```ts
export type EmotionType = 'great' | 'good' | 'calm' | 'not-good' | 'overwhelmed';

// Map the 5 MoodRating keys to the 5 EmotionSystem emotions.
export const MOOD_EMOTION: Record<MoodRating, EmotionType> = {
  5: 'great',
  4: 'good',
  3: 'calm',
  2: 'not-good',
  1: 'overwhelmed',
};
```

> **Spec discrepancy — see note below.** The current `MOOD_MAP` labels are
> `Great / Good / Okay / Not good / Awful`, not the spec's
> `Great / Good / Calm / Not Good / Overwhelmed`. The mapping above uses the
> spec's emotion names; reconcile labels with product/design before shipping.

### Step 2 — Replace `HomeScreen.tsx` line 327 (sparkle ✨)

```tsx
// before
<Text style={[styles.reflectionEyebrow, { color: colors.brand.primary }]}>
  You reflected today ✨
</Text>

// after — either a themed icon or the avatar
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
  <EmotionAvatar emotion="great" size={20} showGlow={false} animated={false} />
  <Text style={[styles.reflectionEyebrow, { color: colors.brand.primary }]}>
    You reflected today
  </Text>
</View>
```

### Step 3 — Replace `HomeScreen.tsx` line 424 (`MOOD_MAP[selectedMood].emoji`)

```tsx
// before
<Text style={[styles.submitText, { color: colors.text.secondary }]}>
  You selected: {MOOD_MAP[selectedMood].emoji} {MOOD_MAP[selectedMood].label} — ready to check in?
</Text>

// after
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <EmotionAvatar emotion={MOOD_EMOTION[selectedMood]} size={28} />
  <Text style={[styles.submitText, { color: colors.text.secondary }]}>
    You selected: {getMoodLabel(selectedMood)} — ready to check in?
  </Text>
</View>
```

### Step 4 — Update the other emoji surfaces

- `MoodSelector.tsx` (lines 21–22): pass `<EmotionAvatar emotion={MOOD_EMOTION[value]} size={...} />` instead of `emoji={MOOD_MAP[value].emoji}`.
- `WeeklyHistoryCard.tsx` (line 99): swap `MOOD_MAP[rating].emoji` for `<EmotionAvatar emotion={MOOD_EMOTION[rating]} size={...} />`.
- `MoodSnapshotCard.tsx` (line 7): replace `getMoodEmoji` usage with `EmotionAvatar`; keep `getMoodLabel` for text.

### Step 5 — Deprecate/remove `emoji`

- Mark `MOOD_MAP[*].emoji` as `@deprecated` and remove `getMoodEmoji()`.
- Keep `getMoodLabel()` (text labels still needed).
- Add a lint rule / grep check to fail CI if a Unicode emoji is introduced in `src/`.

### Step 6 — Verify

- [ ] No Unicode emoji glyphs in `src/**/*.tsx` (grep `\p{Extended_Pictographic}`).
- [ ] All five moods render via `EmotionAvatar`.
- [ ] Animations hold 60 FPS (enable Reanimated profiling).
- [ ] Light & Dark modes render with correct glow/contrast.
