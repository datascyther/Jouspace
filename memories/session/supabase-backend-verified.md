# Supabase Backend — Verified (2026-08-12)

## Live project
- Ref: `rfhvvgvnxbmmgifqqeor` (hosted Supabase, already existed)
- URL: `https://rfhvvgvnxbmmgifqqeor.supabase.co`
- anon key already in `.env` as `VITE_SUPABASE_ANON_KEY` (placeholder fallback exists in `supabaseClient.ts`)

## Smoke test result (PASS)
Used a temp `_smoke.mjs` (now deleted). Validated:
1. `signUp` fires `handle_new_user()` SECURITY DEFINER trigger → auto-creates `profiles` row (`display_name: "You"`).
2. RLS blocks unauthenticated `journal_entries` insert: `new row violates row-level security policy`.
3. Authenticated user can insert + select own rows (count exact, no cross-user leak).
4. `delete from auth.users` cascade-deletes profile + entries.

## Auth config state
- `mailer_autoconfirm` = false (production confirmation emails ON). For the smoke test we temporarily flipped it to true, then reverted.
- `external_email_enabled` = true. `site_url` = localhost:5173, uri_allow_list set.
- Google + Apple OAuth: enabled in `config.toml` via `env(SUPABASE_AUTH_*)`, but NO client IDs/secrets provided by user yet → OAuth buttons currently error until configured.
- Auth uses PKCE flow, storage key `jouspace:supabase:auth`.

## What is wired to Supabase (done)
- `src/types/supabase.ts` (7 tables, `Relationships: []` added — required by supabase-js 2.112)
- `src/lib/supabaseClient.ts`, `src/lib/auth.ts` (signUp/signIn/magicLink/OAuth/onAuthStateChange)
- `src/store/SupabaseJournalStore.ts` (journal entries, realtime, RLS owner)
- `src/store/index.ts` (chooses Supabase vs LocalStorage based on `isSupabaseConfigured`)
- `src/App.tsx` + `src/components/AuthScreen.tsx` (real auth UI)
- Migration `supabase/migrations/20260812000000_init_jouspace.sql` APPLIED via Mgmt API `/database/query` (CLI `db push` blocked by macOS TLS quirk `cli/login-role` x509 OSStatus -26276; worked around).

## Still localStorage-only (todo #6/#7 — NOT done)
- `src/lib/personalization.ts` (personalization table)
- `src/utils/customThemes.ts` (custom_themes table)
- `src/hooks/useJouspaceIntelligence.ts` AI chat history (ai_chat_history table)
- `src/components/AIContextPicker.tsx` + `App.tsx` ai:context (ai_context table)
- ReminderService (reminders col in user_prefs)
- useTheme, nav.ts, draft.ts, permissions (user_prefs / personalization)

## Credentials security
- service_role + secret keys provided by user; NEVER put in VITE_ vars or commit. anon key is fine in `.env`.

## Network/sandbox notes
- Sandbox blocks network → use `requestAllowNetwork=true` for any Supabase API call.
- Supabase CLI TLS broken in sandbox; prefer Mgmt API `https://api.supabase.com/v1/projects/{ref}/database/query` (POST {query}) and `/config/auth` (PATCH) over `db push`/`gen types`.
- zsh history expansion turns `!` into `\!` inside heredocs — avoid `!` in heredoc-written scripts or fix with replace_string_in_file.
