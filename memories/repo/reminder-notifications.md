# Journal reminder notifications (gentle nudge)

Added 2026-08-12. Local (OS-level) reminder notifications so users are nudged to
journal even after the app is closed.

## Files
- `src/notifications/nativeBridge.ts` — talks to Capacitor `LocalNotifications`
  via the injected `window.Capacitor.Plugins` global (same pattern as
  `src/permissions/nativeBridge.ts`). Schedule / cancel / cancelAll / tap listener
  + creates an Android `reminders` channel (IMPORTANCE_DEFAULT, VISIBILITY_PRIVATE).
- `src/notifications/webBridge.ts` — best-effort browser fallback: fires a
  `Notification` immediately when the tab is hidden (page still alive). Cannot defer
  while closed — that is a native-only capability (no Service Worker / Push; kept
  out of scope on purpose).
- `src/notifications/ReminderService.ts` — the brain. `refresh()` (foreground /
  after save) and `armOnBackground()` (on leave). `setRemindersEnabled(bool)` +
  `onReminderOpen(cb)` (tap → open composer).
- `src/notifications/index.ts` — barrel.
- `src/App.tsx` — initial `refresh()` once onboarding is `complete`; registers
  native `App.addListener('appStateChange')` + web `visibilitychange`/`pagehide`
  to refresh/arm; `onReminderOpen` navigates to the composer (`write` tab);
  `handleSaveEntry` calls `refresh()` so a saved entry cancels the draft nudge.
- `src/components/PermissionPrimerScreen.tsx` — enabling/disabling the
  notifications toggle now calls `ReminderService.setRemindersEnabled(nextOn)`,
  so the primer's soft opt-out truly stops reminders.

## Behavior
- A single **recurring evening reminder** (default 20:00 local, `repeats: true`)
  with calm copy rotated by day-of-year and personalized with the display name.
- A **one-off "finish your thought" nudge** (~2h after the app is backgrounded)
  when an unsaved draft exists (`readDraft()`). Covers the mid-journal-close case.
- Gated on the existing notifications permission (`granted`) AND an app-level
  `jouspace:reminders:v1` `enabled` pref (default true).
- Ids: DAILY_ID=1001, DRAFT_ID=1002 (cancelled/replaced, never leaked).
- No recursion/loops — the OS repeats the daily reminder.

## Notes / tuning
- Change `EVENING_HOUR`/`EVENING_MINUTE`/`DRAFT_NUDGE_DELAY_MS` in
  `ReminderService.ts` to retune timing.
- Web users won't get deferred (closed-tab) reminders — native APK build delivers
  them. Native Android still needs `POST_NOTIFICATIONS` in AndroidManifest (already
  documented in `capacitor.config.ts`; run `npx cap sync` for a real build).
