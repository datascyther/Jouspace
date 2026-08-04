#!/usr/bin/env bash
#
# setup-supabase-auth.sh
#
# Automates the Supabase-side auth configuration for Jouspace:
#   1. Enables anonymous sign-ins (fixes the guest RLS violations).
#   2. Registers the Google OAuth provider (reads client id/secret from env).
#   3. Pushes supabase/config.toml (auth settings + redirect URLs) to the
#      linked Supabase project.
#
# PREREQUISITES (set before running):
#   export SUPABASE_ACCESS_TOKEN=...        # from https://supabase.com/dashboard/account/tokens
#   # The Google client id/secret below must FIRST be created by a human in
#   # Google Cloud Console (see HUMAN STEP at the bottom of this script).
#   export GOOGLE_CLIENT_ID=...             # optional here; required for Google to actually work
#   export GOOGLE_CLIENT_SECRET=...         # optional here; required for Google to actually work
#
# Then:  npm run setup:auth
#
set -euo pipefail

PROJECT_REF="whjdjxtbyoojrwvbearg"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN is not set." >&2
  echo "Get one at https://supabase.com/dashboard/account/tokens and run:" >&2
  echo "  export SUPABASE_ACCESS_TOKEN=your_token" >&2
  exit 1
fi

# 1. Push the auth config (anonymous sign-ins, Google provider, redirect URLs).
echo ">> Pushing supabase/config.toml to project $PROJECT_REF ..."
supabase config push --project-ref "$PROJECT_REF" --yes

# 2. Set the Google OAuth credentials as project secrets (referenced by
#    config.toml via env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID/SECRET)).
if [ -n "${GOOGLE_CLIENT_ID:-}" ] && [ -n "${GOOGLE_CLIENT_SECRET:-}" ]; then
  echo ">> Setting Google OAuth secrets on the project ..."
  supabase secrets set \
    SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
    SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="$GOOGLE_CLIENT_SECRET" \
    --project-ref "$PROJECT_REF" --yes
else
  echo ">> Skipping Google secret upload: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set."
  echo "   Create the OAuth client in Google Cloud Console first (see HUMAN STEP), then re-run with them exported."
fi

echo ""
echo "Done. Supabase-side auth config applied."
echo ""
echo "==================================================================="
echo "HUMAN STEP (cannot be automated — requires a Google account):"
echo "  1. Google Cloud Console > APIs & Services > Credentials > Create OAuth client ID."
echo "     - Application type: Web application."
echo "     - Authorized redirect URI: https://${PROJECT_REF}.supabase.co/auth/v1/callback"
echo "  2. Copy the Client ID and Client Secret and export them, then re-run:"
echo "       export GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=..."
echo "       npm run setup:auth"
echo "  3. In Supabase Dashboard > Auth > URL Configuration, confirm the app"
echo "     redirect URLs include: jouspace://auth/callback and neeva://auth/callback"
echo "==================================================================="
