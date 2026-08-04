#!/bin/bash
# =============================================================================
# Jouspace — Repository Security Cleanup
# =============================================================================
# This script documents the steps to remove sensitive files from git tracking.
# Run once to clean up any committed secrets.
#
# WARNING: This rewrites git history. Coordinate with your team before running.
# =============================================================================

set -euo pipefail

echo "==> Checking for sensitive files tracked by git..."

# Check if .env is tracked (should NOT be — it contains the NVIDIA API key)
if git ls-files .env | grep -q .env; then
  echo "WARNING: .env is tracked by git! Removing..."
  echo "  Run: git rm --cached .env"
  echo "  Then add .env to .gitignore (already present) and commit:"
  echo "    git add .gitignore"
  echo '    git commit -m "chore: remove .env from version control"'
else
  echo "OK: .env is not tracked by git."
fi

# Check for any .env* files tracked (except .env.example)
for f in $(git ls-files | grep -E '^\.env' | grep -v '\.env\.example$'); do
  echo "WARNING: $f is tracked by git!"
done

# Check for keystore files
if git ls-files '*.keystore' '*.jks' | grep -q .; then
  echo "WARNING: Keystore files are tracked by git!"
fi

# Check for Firebase native configs
if git ls-files google-services.json GoogleService-Info.plist | grep -q .; then
  echo "WARNING: Firebase native configs are tracked by git!"
fi

echo ""
echo "==> Recommended actions:"
echo "  1. Remove sensitive files from tracking:"
echo "     git rm --cached .env"
echo ""
echo "  2. If the NVIDIA API key was committed in past commits, rotate it:"
echo "     https://build.nvidia.com/ -> regenerate API key"
echo ""
echo "  3. For a full history scrub (BFG Repo-Cleaner):"
echo "     bfg --delete-files .env"
echo "     git reflog expire --expire=now --all && git gc --aggressive --prune=now"
echo ""
echo "  4. Force push after cleanup:"
echo "     git push origin --force --all"
