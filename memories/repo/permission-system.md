# Permission system (mic + notifications)

Centralized, store-compliant permission handling added 2026-08-12.

## Files
- `src/permissions/types.ts` — `PermissionKey`, `PermissionState`, `PermissionResult`.
- `src/permissions/registry.ts` — declarative `PERMISSIONS` catalogue + `PERMISSION_ORDER`. Add new perms here.
- `src/permissions/nativeBridge.ts` — talks to Capacitor via the injected `window.Capacitor.Plugins` global (Microphone, LocalNotifications, App.openSettings). No static imports, so the web build runs even when the optional native packages aren't installed.
- `src/permissions/webBridge.ts` — `navigator.mediaDevices.getUserMedia` (mic) + `Notification.requestPermission()` (notifications).
- `src/permissions/PermissionService.ts` — `getStatus / request / ensure / openSettings`. `ensure()` is the one to call from feature code: grants if needed, never re-prompts when permanently denied, returns `{ok, reason}`.
- `src/permissions/usePermissions.ts` — `usePermission(key)` and `usePermissions()` React hooks.
- `src/components/PermissionPrimerScreen.tsx` — first-run onboarding primer (after splash). Requests in-context so it satisfies Apple 5.1.1 / Google Play.

## Gating
- Mic is gated in `AIScreenContent` and `JournalScreenContent` via `handleMic` (calls `mic.ensure()` before `voice.toggle()`). The `useVoiceInput` hook itself was left untouched (keeps its tests green).
- App onboarding flow: `onboardingScreen: 'splash' | 'permissions' | 'complete'`. Primer shows once; `localStorage['jouspace.onboarded']='1'` skips it on later runs.

## Native setup (NOT yet installed — network blocked in sandbox)
- `package.json` lists `@capacitor/core`, `@capacitor/microphone`, `@capacitor/local-notifications`, `@capacitor/app`, `@capacitor/permissions`. Run `npm install` + `npx cap sync` to activate the native path.
- Required native declarations documented in `capacitor.config.ts`: AndroidManifest (`RECORD_AUDIO`, `POST_NOTIFICATIONS`) + iOS Info.plist `NSMicrophoneUsageDescription` / `NSLocalNotificationUsageDescription`.
- The web build works without the packages because `nativeBridge` uses the runtime `window.Capacitor` global and falls back to web APIs.

## Design notes
- "Full device access at launch" is intentionally NOT done — stores reject blanket launch-time prompts; permissions are per-feature, revocable, and some are one-time. The primer + just-in-time `ensure()` achieves the smooth, no-broken-features goal compliantly.
- Web Speech API still does the actual STT; the permission layer only gates the mic grant. Consider migrating STT off Google servers later to honor the "Private Journal" positioning.
