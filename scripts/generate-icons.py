#!/usr/bin/env python3
"""Generate Expo default assets from the Jouspace logo"""

from PIL import Image
import os

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'shared', 'assets')

# Find the logo source
LOGO_PATH = None
for candidate in ['jouspace-logo.png', 'jouspace-logo.jpg']:
    p = os.path.join(ASSETS_DIR, candidate)
    if os.path.exists(p):
        LOGO_PATH = p
        break

if not LOGO_PATH:
    raise FileNotFoundError("No logo found in src/shared/assets/")


def main():
    img = Image.open(LOGO_PATH).convert('RGBA')

    # 1. icon.png — 1024x1024
    icon = img.resize((1024, 1024), Image.LANCZOS)
    icon.save(os.path.join(ASSETS_DIR, 'icon.png'), 'PNG', optimize=True)
    print(f"  ✓ icon.png (1024x1024)")

    # 2. adaptive-icon.png — 1024x1024, mark within center 66% safe zone
    adaptive = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    mark_size = int(1024 * 0.66)
    mark = img.resize((mark_size, mark_size), Image.LANCZOS)
    offset = (1024 - mark_size) // 2
    adaptive.paste(mark, (offset, offset), mark)
    adaptive.save(os.path.join(ASSETS_DIR, 'adaptive-icon.png'), 'PNG', optimize=True)
    print(f"  ✓ adaptive-icon.png (1024x1024)")

    # 3. favicon.png — 48x48
    favicon = img.resize((48, 48), Image.LANCZOS)
    favicon.save(os.path.join(ASSETS_DIR, 'favicon.png'), 'PNG', optimize=True)
    print(f"  ✓ favicon.png (48x48)")

    # 4. splash.png — 1242x2436 (cover: resize to fill, center crop)
    TARGET_W, TARGET_H = 1242, 2436
    target_aspect = TARGET_W / TARGET_H
    src_aspect = img.width / img.height
    if src_aspect > target_aspect:
        new_h = TARGET_H
        new_w = int(img.width * (TARGET_H / img.height))
    else:
        new_w = TARGET_W
        new_h = int(img.height * (TARGET_W / img.width))
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - TARGET_W) // 2
    top = (new_h - TARGET_H) // 2
    splash = resized.crop((left, top, left + TARGET_W, top + TARGET_H))
    splash.save(os.path.join(ASSETS_DIR, 'splash.png'), 'PNG', optimize=True)
    print(f"  ✓ splash.png (1242x2436)")

    print(f"\nAll assets generated in {ASSETS_DIR}")


if __name__ == '__main__':
    main()
