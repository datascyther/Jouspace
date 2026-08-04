# Jouspace — Sprint S0.8 — Environment Configuration

Central reference for every backend environment variable. **No secret ever lives in
the client bundle.** Client-exposed vars use the `EXPO_PUBLIC_` / `VITE_` prefix and
carry only the anon key. The `service_role` key is server-only.

## Required variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | client | Supabase project REST/Auth URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client | Public anon key (RLS-enforced) |
| `EXPO_PUBLIC_SUPABASE_PROJECT_ID` | client | Project ref (e.g. `whjdjxtbyoojrwvbearg`) |
| `VITE_SUPABASE_URL` | client (web) | Mirror of `EXPO_PUBLIC_SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | client (web) | Mirror of `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `VITE_SUPABASE_PROJECT_ID` | client (web) | Mirror of `EXPO_PUBLIC_SUPABASE_PROJECT_ID` |
| `SUPABASE_PROD_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS — Edge Functions / admin tasks. Never `EXPO_PUBLIC_`/`VITE_`. |
| `SUPABASE_DEV_SERVICE_ROLE_KEY` | **server only** | Dev branch service role (reuse prod until branch enabled) |
| `EXPO_PUBLIC_STORAGE_BUCKETS` | client | Comma list: `avatars,journal,media,exports` |
| `EXPO_PUBLIC_NVIDIA_API_KEY` | client* | AI provider key (see note) |
| `EXPO_PUBLIC_NVIDIA_BASE_URL` | client | `https://integrate.api.nvidia.com/v1` |
| `EXPO_PUBLIC_NVIDIA_MODEL` | client | e.g. `nvidia/nemotron-3-ultra-550b-a55b` |
| `SUPABASE_ACCESS_TOKEN` | CI only | Personal access token for `supabase` CLI (never commit) |

\* The NVIDIA key is used **server-side** by Edge Functions for AI features. If it
must reach the model from the client, proxy it through a Supabase Edge Function so
the raw key stays off-device. Prefer the server-only path.

## Storage configuration
Buckets are created by `backend/storage/0003_storage.sql`: `avatars`, `journal`,
`media`, `exports` — all private, namespaced by `user_id/`.

## Per-environment files (already present at repo root)
- `.env.development` — dev (currently reuses prod credentials; swap for the `develop` branch once Pro plan branching is enabled)
- `.env.staging` — staging (reuses prod)
- `.env.production` — production
- `.env.example` — template
- `.env` — gitignored local overrides; holds the `service_role` keys

## Verification
`backend/env/verify-env.mjs` (run via `node backend/env/verify-env.mjs`) checks that
the required client vars are present and that no `service_role` key leaked into a
committed `EXPO_PUBLIC_`/`VITE_` variable.
