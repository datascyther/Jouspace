#!/bin/bash
# generate-android-icons.sh
# Generates Android mipmap launcher icons from the existing PWA source icon.
# Requires: sips (macOS built-in) or ImageMagick (convert).
#
# Usage: ./scripts/generate-android-icons.sh
# Output: android-resources/{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SRC="${REPO_ROOT}/public/icon-192.png"
OUT_DIR="${REPO_ROOT}/android-resources"

if [ ! -f "$SRC" ]; then
  echo "Source icon not found: $SRC"
  exit 1
fi

# Pick the best resize tool available
resize() {
  local src="$1" dst="$2" size="$3"
  if command -v sips &>/dev/null; then
    sips -z "$size" "$size" "$src" --out "$dst" >/dev/null 2>&1
  elif command -v convert &>/dev/null; then
    convert "$src" -resize "${size}x${size}" "$dst"
  else
    echo "Warning: no resize tool found (sips/ImageMagick). Copying source as-is."
    cp "$src" "$dst"
  fi
}

for pair in "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192"; do
  density="${pair%%:*}"
  size="${pair##*:}"
  dir="${OUT_DIR}/${density}"
  mkdir -p "$dir"

  resize "$SRC" "${dir}/ic_launcher.png" "$size"
  resize "$SRC" "${dir}/ic_launcher_round.png" "$size"

  echo "  ${density}: ${size}x${size} ✓"
done

echo "Android launcher icons generated in ${OUT_DIR}/"
