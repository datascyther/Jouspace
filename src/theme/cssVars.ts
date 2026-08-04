/**
 * Maps a ThemeTokens object to CSS custom properties.
 *
 * The kebab-case keys MUST match the variable names referenced by
 * `tailwind.config.js` (e.g. `--background-primary`, `--brand-primary`)
 * and by `global.css`. Keeping this mapping in code means the runtime
 * theme injection and the static stylesheet can never disagree.
 */

import type { ThemeTokens } from './light';

type CssVarMap = Record<string, string>;

function flatten(prefix: string, obj: Record<string, unknown>, out: CssVarMap) {
  for (const [key, value] of Object.entries(obj)) {
    const name = `${prefix}-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
    if (value && typeof value === 'object') {
      flatten(name, value as Record<string, unknown>, out);
    } else {
      out[name] = String(value);
    }
  }
}

export function themeToCssVars(theme: ThemeTokens): CssVarMap {
  const out: CssVarMap = {};
  flatten('', theme as unknown as Record<string, unknown>, out);
  return out;
}

/** Builds a CSS string for a `:root` / `.dark` rule from tokens. */
export function themeToCssRule(selector: string, theme: ThemeTokens): string {
  const vars = themeToCssVars(theme);
  const body = Object.entries(vars)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${body}\n  }`;
}
