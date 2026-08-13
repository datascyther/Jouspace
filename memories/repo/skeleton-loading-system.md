# Skeleton / Loading System

Single reusable loading skeleton built per the architecture spec (one component, no per-screen skeletons).

## Files
- `src/components/Skeleton.tsx` — `Skeleton` (layout presets), `BrandedSpinner` (cold-start), `useLoadGuard` (8s timeout hook).
- `src/index.css` — `.skeleton-shimmer` (base `#E8E6E1`, white-0.4 gradient sweep, `translateX(-100%→100%)` 1.2s ease-in-out) + `.skeleton-static` (no animation) + `brandPulse` keyframe / `.animate-brand-pulse` (0.4→1→0.4, 2s).

## API
- `<Skeleton layout="chat"|"list"|"card"|"form" count={n} animate={true} composer={true} />`
  - `chat`: avatar circle + message bar rows; `composer` (default true) adds a full-width composer bar. Set `composer={false}` when a real composer is already visible (Stop Rule: never skeletonize visible buttons).
  - `list`: full-width 72px rounded rows, 16px gap (Memory entries).
  - `card`: 96px rounded rows (onboarding/settings).
  - `form`: 56px input rows + a button row.
- `<BrandedSpinner />` — logo mark pulse + "Opening your space..." Used by `SplashScreen` (cold start only; never as a content skeleton).
- `useLoadGuard(isLoading, timeoutMs=8000)` — returns true if loading exceeds timeout (flips a hung skeleton to an error state).

## Wiring
- Chat (`AIScreenContent`): `ai.isThinking` → `<Skeleton layout="chat" count={1} composer={false} />`; `useLoadGuard(ai.isThinking, 8000)` → inline `ErrorState` retry (aborts + lets user resend).
- Memory (`MemoryScreenContent`): `isLoading` prop → `<Skeleton layout="list" count={5} />`; `useLoadGuard` → `ErrorState`.
- App.tsx simulates a first-open Memory fetch (~700ms via `useLayoutEffect`, once per session) so the list skeleton is demonstrable; `retryMemory` re-runs it.

## Notes
- Error/empty visuals reuse the existing `ErrorState` / `EmptyState` components (on-brand) rather than duplicating the spec's exact hex colors.
- `LazyMarkdown.tsx` still uses the `.skeleton-shimmer` CSS class directly — kept compatible.
- Old `SkeletonCard`/`SkeletonRow`/`SkeletonAvatar` exports were removed (unused; not imported anywhere).
