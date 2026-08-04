#!/usr/bin/env bash
# Ensures adb is available at $ANDROID_HOME/platform-tools/adb for Expo/React Native.
set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
BREW_PLATFORM_TOOLS="$(brew --prefix)/Caskroom/android-platform-tools"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required. Install from https://brew.sh"
  exit 1
fi

if ! brew list --cask android-platform-tools >/dev/null 2>&1; then
  echo "Installing android-platform-tools..."
  brew install --cask android-platform-tools
fi

LATEST_VERSION="$(ls -1 "$BREW_PLATFORM_TOOLS" | sort -V | tail -1)"
SOURCE="$BREW_PLATFORM_TOOLS/$LATEST_VERSION/platform-tools"

if [[ ! -x "$SOURCE/adb" ]]; then
  echo "adb not found at $SOURCE/adb"
  exit 1
fi

mkdir -p "$ANDROID_HOME"
ln -sfn "$SOURCE" "$ANDROID_HOME/platform-tools"

echo "Android SDK ready:"
echo "  ANDROID_HOME=$ANDROID_HOME"
echo "  adb=$ANDROID_HOME/platform-tools/adb"
"$ANDROID_HOME/platform-tools/adb" version
