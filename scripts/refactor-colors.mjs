// Bulk refactor: replace Tailwind arbitrary-value hex colors (`bg-[#6D4FD7]`)
// with their design tokens (`bg-accent`) across all TSX components.
//
// Source of truth for the mapping: src/tokens.ts + the `@theme` block in
// src/index.css (which generates the Tailwind utilities).
//
// Run from repo root: node scripts/refactor-colors.mjs
// It prints a per-file summary and any hex colors it could NOT convert.

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

// hex (uppercase, 6-digit) -> token name (must exist in @theme / tokens.ts)
const COLOR_TO_TOKEN = {
  FBF9F5: 'background',
  FFFEFC: 'surface',
  '0D102B': 'primaryText',
  '68677E': 'secondaryText',
  '8B8998': 'muted',
  '6D4FD7': 'accent',
  '5C3EC5': 'accentHover',
  '5034B3': 'accentActive',
  '5639BE': 'accentAlt',
  F0ECFF: 'accentSoft',
  E7E1EF: 'border',
  E9E4E0: 'divider',
  EFEBF5: 'avatarBg',
  F3F0EB: 'inputBg',
  C53030: 'error',
  FDECEC: 'errorBg',
  F5C6C6: 'errorBorder',
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === '.tsx') out.push(p);
  }
  return out;
}

let total = 0;
const leftover = [];

for (const file of walk(SRC)) {
  const original = readFileSync(file, 'utf8');
  let content = original;
  let fileCount = 0;

  for (const [hex, token] of Object.entries(COLOR_TO_TOKEN)) {
    // Matches `utility-[#HEX]` keeping the utility prefix; preserves any
    // opacity modifier that follows the closing bracket (e.g. /25, /40).
    const re = new RegExp(`(?<=-)\\[#${hex}\\](?=/|\\s|"|'|\`)`, 'gi');
    const before = content;
    content = content.replace(re, token);
    fileCount += countDiff(before, content);
  }

  if (content !== original) {
    writeFileSync(file, content);
    total += fileCount;
    console.log(`${fileCount.toString().padStart(3)}  ${file.replace(SRC + '/', '')}`);
  }

  // Report any hex arbitrary-values that survived (should be none).
  const re = /\[#([0-9A-Fa-f]{3,8})\]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const line = content.slice(0, m.index).split('\n').length;
    leftover.push(`${file.replace(SRC + '/', '')}:${line}  [#${m[1]}]`);
  }
}

function countDiff(a, b) {
  // crude: count removed `[#HEX]` brackets between two strings
  const fa = (a.match(/\[#[0-9A-Fa-f]{6}\]/g) || []).length;
  const fb = (b.match(/\[#[0-9A-Fa-f]{6}\]/g) || []).length;
  return Math.max(0, fa - fb);
}

console.log(`\nConverted ${total} hex literals across ${walk(SRC).length} TSX files.`);
if (leftover.length) {
  console.log('\nUnconverted (manual review needed):');
  for (const l of leftover) console.log(`  ${l}`);
} else {
  console.log('No unconverted hex arbitrary-values remain in TSX.');
}
