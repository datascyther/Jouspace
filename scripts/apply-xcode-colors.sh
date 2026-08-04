#!/bin/bash
# apply-xcode-colors.sh
# Copies Xcode color assets from assets/xcassets/ into the ios/ build directory
# after `npx expo prebuild`. Run as a post-prebuild hook.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC="$PROJECT_ROOT/assets/xcassets"
IOS_DIR="$PROJECT_ROOT/ios"

if [ ! -d "$IOS_DIR" ]; then
  echo "⚠️  ios/ directory not found. Run 'npx expo prebuild' first."
  exit 1
fi

# Find the .xcassets in the ios directory
XCODE_ASSETS=$(find "$IOS_DIR" -name "*.xcassets" -type d | head -1)

if [ -z "$XCODE_ASSETS" ]; then
  echo "⚠️  No .xcassets found in ios/. Run 'npx expo prebuild' first."
  exit 1
fi

echo "🎨 Copying color assets to $XCODE_ASSETS"

for colorset in "$SRC"/*.colorset; do
  if [ -d "$colorset" ]; then
    NAME=$(basename "$colorset")
    DEST="$XCODE_ASSETS/$NAME"
    if [ -d "$DEST" ]; then
      echo "   Updating $NAME"
      rm -rf "$DEST"
    else
      echo "   Creating $NAME"
    fi
    cp -R "$colorset" "$DEST"
  fi
done

echo "✅ Color assets applied successfully."
