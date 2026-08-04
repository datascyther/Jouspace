# Jouspace Emotion System — API Reference

Concise reference for engineers implementing `EmotionAvatar` and the surrounding
emotion system. See [`EMOTION_SYSTEM.md`](./EMOTION_SYSTEM.md) for design, assets,
and migration details.

---

## `EmotionType` (enum)

Defined in `src/shared/types/index.ts`.

```ts
export type EmotionType = 'great' | 'good' | 'calm' | 'not-good' | 'overwhelmed';
```

| Value | MoodRating | Label (current `MOOD_MAP`) | Palette (see spec §3) |
| --- | --- | --- | --- |
| `'great'` | `5` | Great | Warm Gold → Soft Orange |
| `'good'` | `4` | Good | Lavender → Violet |
| `'calm'` | `3` | Okay | Sky Blue → Cyan |
| `'not-good'` | `2` | Not good | Slate Blue → Indigo |
| `'overwhelmed'` | `1` | Awful | Coral → Muted Purple |

> **Note:** Emotion names follow the spec. Current `MOOD_MAP` labels differ
> (`Okay` / `Awful`). Reconcile labels with design before release.

`mood → emotion` mapping helper:

```ts
export const MOOD_EMOTION: Record<MoodRating, EmotionType> = {
  5: 'great', 4: 'good', 3: 'calm', 2: 'not-good', 1: 'overwhelmed',
};
```

---

## `EmotionAvatar` Props

Component: `src/shared/components/EmotionAvatar.tsx`

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `emotion` | `EmotionType` | yes | — | Which emotion to render. |
| `size` | `number` | no | `48` | Square dimension in dp. |
| `animated` | `boolean` | no | `true` | Enable idle animation. |
| `selected` | `boolean` | no | `false` | Selection ring + slight scale. |
| `disabled` | `boolean` | no | `false` | Dimmed; animation off; no haptics. |
| `showLabel` | `boolean` | no | `false` | Render label text below orb. |
| `showGlow` | `boolean` | no | `true` | Toggle ambient glow layer. |

**Implied return / behavior**

- `accessibilityRole="image"`, `accessibilityLabel` = emotion label.
- Haptic: `expo-haptics` `selectionAsync()` on press when not `disabled`.
- Theme: reads `useTheme()` (`src/hooks/useTheme.ts`) for Light/Dark tokens.

---

## Animation Timing Constants

Use these shared constants (suggested export from `EmotionAvatar` or a `motion` util).

| Emotion | Transform | From → To → From | Duration (ms) | Easing |
| --- | --- | --- | --- | --- |
| `great` | `scale` | `1.00 → 1.03 → 1.00` | `2800` | `inOut(sin)` |
| `good` | `translateY` | `2 → 0 → 2` (dp) | `3200` | `inOut(sin)` |
| `calm` | `glow opacity` | `0.85 → 1.00 → 0.85` | `4000` | `inOut(sin)` |
| `not-good` | `rotate` | `-2° → 2° → 0°` | `3600` | `inOut(sin)` |
| `overwhelmed` | `translateX` micro-shake | `0 → 1.5 → -1.5 → 0` (dp) | `2600` | `inOut(sin)` |

```ts
export const EMOTION_MOTION = {
  great:       { property: 'scale',      from: 1.0,  to: 1.03, duration: 2800 },
  good:        { property: 'translateY', from: 2,   to: 0,    duration: 3200 },
  calm:        { property: 'glow',       from: 0.85, to: 1.0,  duration: 4000 },
  'not-good':  { property: 'rotate',     from: -2,  to: 2,    duration: 3600 },
  overwhelmed: { property: 'shake',      from: 0,   to: 1.5,  duration: 2600 },
} as const;
```

All animations loop infinitely via `withRepeat` and pause when `animated === false` or `disabled === true`.

---

## Dependencies (already in repo)

| Package | Version | Use |
| --- | --- | --- |
| `react-native-reanimated` | `~4.1.1` | Idle animations on UI thread. |
| `expo-haptics` | `~15.0.8` | Selection haptics. |

---

## Asset Import Paths

```
src/shared/assets/emotion-system/{great,good,calm,not-good,overwhelmed}.svg
```

Load via `require(...)` (Metro bundles SVGs as assets) or a typed map:

```ts
const ASSETS: Record<EmotionType, number> = {
  great: require('@/shared/assets/emotion-system/great.svg'),
  good: require('@/shared/assets/emotion-system/good.svg'),
  calm: require('@/shared/assets/emotion-system/calm.svg'),
  'not-good': require('@/shared/assets/emotion-system/not-good.svg'),
  overwhelmed: require('@/shared/assets/emotion-system/overwhelmed.svg'),
};
```
