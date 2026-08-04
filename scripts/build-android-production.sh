#!/bin/bash
# =============================================================================
# Jouspace — Android Production Build Script
# =============================================================================
# Prerequisites:
#   1. Place google-services.json in project root
#   2. Generate a release keystore:
#      keytool -genkey -v -keystore release.keystore -alias release \
#        -keyalg RSA -keysize 2048 -validity 10000
#   3. Set the following env vars (or add to CI secrets):
#      - ANDROID_KEYSTORE_PASSWORD
#      - ANDROID_KEY_ALIAS
#      - ANDROID_KEY_PASSWORD
#   4. Install EAS CLI: npm install -g eas-cli
#   5. Log in: eas login
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Syncing environment variables (if configured)..."
cd "$PROJECT_ROOT"
node scripts/sync-firebase-env.mjs 2>/dev/null || true

echo "==> Setting APP_ENV=production"
export APP_ENV=production

echo "==> Building Android production bundle via EAS..."
eas build --platform android --profile production

echo "==> Done. APK/AAB will be available in EAS dashboard."
