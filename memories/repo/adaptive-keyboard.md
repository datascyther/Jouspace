# Adaptive Keyboard (web/Capacitor)

Jouspace is a **React web app wrapped with Capacitor**, so the RN keyboard spec
(`Keyboard.addListener`, `Animated`, `KeyboardAvoidingView`) was adapted to
web-native primitives:

- **Detection:** `window.visualViewport` `resize`/`scroll` events (the web
  equivalent of `keyboardWillShow`/`DidShow`). Height = `innerHeight - vv.height - vv.offsetTop`.
- **Source of truth:** `KeyboardProvider` in `src/hooks/useAdaptiveKeyboard.tsx`
  exposes `{ keyboardHeight, keyboardVisible, inputMode, safeAreaBottom,
  visualViewportHeight }` via `useKeyboard()`, and writes three CSS vars on
  `:root`: `--vvh` (visible height), `--kb-height`, `--kb-open`.
- **Shell resize:** `AppScreen` frame height = `h-[var(--vvh)]` (mobile) /
  `md:h-[880px]` (desktop). Because the frame shrinks to the visible area, the
  flex layout lifts the pinned composer above the keyboard at 60fps (no
  `transform` needed on the composer itself — the ancestor height drives it).
- **Tab bar:** `BottomNavigation` has a `hideOnKeyboard?: boolean` prop. When
  `true` AND `keyboardVisible`, it collapses (`max-h-0` + `translate-y-20` +
  fade). Per product decision, the nav hides **only on input screens**, not
  globally. Currently only `AIScreenContent` passes `hideOnKeyboard`.
- **AI screen wiring (`AIScreenContent`):** scroll container ref tracks
  `atBottomRef`; on keyboard toggle, pins to bottom if already at bottom
  (preserves position otherwise); `handleScroll` blurs the input to dismiss the
  keyboard (RN `keyboardDismissMode="on-drag"`); composer gets `pb-composer-kb`
  (`max(8px, env(safe-area-inset-bottom))`) when the keyboard is open.

## Status / scope
MVP covers the **AI chat screen only**. Remaining per the original 7-phase spec:
roll out to Journal editor (pass `hideOnKeyboard`), add Android focus
"anticipation" (pre-set estimate before `visualViewport` fires), iPad
split/floating keyboard guards, and verify on real Gboard/SwiftKey/Hardware.

## Known refinement
iOS may scroll the window to reveal the focused input (`vv.offsetTop > 0`),
which can drift the AI header. Consider locking body scroll on mobile or
resetting window scroll on focus. Not yet done (MVP).
