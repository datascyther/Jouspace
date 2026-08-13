# Supabase Full Cloud Sync — Wiring Complete (2026-08-13)

## Status: DONE (except OAuth creds)

### What was finished this session
- **Generalized `SupabaseSyncStore`** (`src/lib/supabaseSync.ts`): constructor now takes
  `userIdColumn` (default `'user_id'`) + `onConflict` (default `'user_id'`). `syncUp`,
  `syncDelete`, `hydrate` use `this.userIdColumn` instead of hardcoded `user_id`. Removed the
  `T extends Record<string, unknown>` constraint; upsert row cast `as never` to satisfy
  supabase strict typing.
- **`src/lib/supabaseProfile.ts`**: `profiles` table now uses `userIdColumn:'id'`,
  `onConflict:'id'`, with `toRow`/`fromRow` transforms for `display_name`/`joined_date`.
  `DEFAULT_DISPLAY_NAME` lives here (avoids the earlier circular import).
- **`src/lib/supabaseHydrate.ts`** (NEW): `hydrateAllUserSync()` →
  `Promise.allSettled` over `hydrateProfile`, `hydrateCustomThemes`, `hydrateChatHistory`,
  `hydrateAiContext`, `hydrateUserPrefs`. (profile + personalization auto-hydrate via their
  store constructor's `onAuthStateChange`; harmless to keep them here.)
- **Consumer wiring** — every writer now also calls `queueUserPrefsSync()` (cloud upsert of
  `user_prefs`) or delegates to a cloud module:
  - `useTheme.ts` `setTheme`
  - `utils/nav.ts` `writeStoredNav`
  - `utils/draft.ts` `writeDraft` + `clearDraft`
  - `notifications/ReminderService.ts` `writeEnabled`
  - `permissions/PermissionService.ts` `writeStore`
  - `App.tsx` `finishOnboarding` (KEY `jouspace.onboarded`!)
- **`App.tsx`**: auth effect now calls `void hydrateAllUserSync()` on sign-in;
  `aiContext` initializer uses `loadAiContext()`, `handleSelectContext` uses `saveAiContext(next)`.
- **`useJouspaceIntelligence.ts`**: `loadChatMessages`/`saveChatMessages`/`clearChatMessages`
  delegate to `../lib/supabaseChatHistory` (same `jouspace:ai:chat:messages` key).
- **`JournalScreenContent.tsx` + `SpacePickerSheet.tsx`**: import `CustomTheme`/`saveCustomTheme`/
  `findCustomThemeById`/`slugifyTheme`/`isReservedThemeId` from `../lib/supabaseCustomThemes`.
- **`personalization.ts`**: already routed through `SupabaseSyncStore` (done earlier).

### Verification
- `npx tsc --noEmit` → clean
- `npm test` → 138/138 pass (localStorage keys preserved: `jouspace:profile`,
  `jouspace:theme`, `jouspace:nav`, `jouspace:journal:draft`, `jouspace.permissions.v1`,
  `jouspace:reminders:v1`, `jouspace.onboarded`, `jouspace:ai:chat:messages`,
  `jouspace:spaces:custom`, `jouspace:ai:context`).
- `npm run build` → `dist/index.html` single-file built OK.

### OAuth STATUS (updated 2026-08-13)
- **Email**: enabled (external_email_enabled=true, enable_confirmations=true).
- **Google**: ENABLED via Management API PATCH.
  - client_id `1090388569312-ld2dnkjorivqalm4ov96qun20hul48pp.apps.googleusercontent.com`
  - PATCH used a Supabase PAT `<SUPABASE_PAT>` (full-account
    access). Recommend revoking/rotating it after use. Live config stores the secret hashed.
  - Google console authorized origin `https://rfhvvgvnxbmmgifqqeor.supabase.co`,
    redirect `https://rfhvvgvnxbmmgifqqeor.supabase.co/auth/v1/callback` (already added).
- **Apple**: POSTPONED (user decision). `supabase/config.toml` `[auth.external.apple]` set to
  `enabled = false`. Live project `external_apple_enabled=false`. Do NOT configure until the
  user provides a Services ID + `.p8` key.

### Production redirect caveat (still open)
Live `site_url` is `http://localhost:5173` and `additional_redirect_urls` only has localhost.
For the DEPLOYED app to sign in with Google, we must PATCH `site_url` (+ `additional_redirect_urls`)
to the production origin (e.g. https://jouspace.fly.dev). **Need the user's production URL.**
Local dev works as-is.

### Optional housekeeping (not done)
Could add `SUPABASE_AUTH_GOOGLE_CLIENT_ID` / `SUPABASE_AUTH_GOOGLE_SECRET` to the git-ignored
`.env` so a future `supabase config push` stays in sync with config.toml's `env()` refs. Skipped
to avoid storing the secret in more places than necessary; live project is already configured via API.
