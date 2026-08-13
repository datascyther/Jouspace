/**
 * supabaseCustomThemes — cloud-backed custom themes (custom_themes table).
 *
 * The `custom_themes` table is multi-row (one row per user theme, keyed by
 * (user_id, id)). This module mirrors the localStorage list (`jouspace:spaces:custom`)
 * to Supabase: reads stay synchronous from localStorage; writes are fire-and-
 * forget upserts; on sign-in the remote set is merged into localStorage (by id).
 *
 * The pure helpers (slugify / validation / storage shape) are reused from
 * `utils/customThemes` so the on-disk format is unchanged.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { loadSession } from '../lib/auth';
import {
  readCustomThemes as readLocal,
  writeCustomThemes as writeLocal,
  type CustomTheme,
} from '../utils/customThemes';

/** Synchronous read from the local mirror (unchanged behavior). */
export function readCustomThemes(
  storage: Pick<Storage, 'getItem'> = localStorage,
): CustomTheme[] {
  return readLocal(storage);
}

/** Synchronous write to localStorage + async cloud upsert of the full list. */
export function writeCustomThemes(
  themes: CustomTheme[],
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  writeLocal(themes, storage);
  void syncUpThemes(themes);
}

/** Upsert a single theme into localStorage + cloud. */
export function saveCustomTheme(
  theme: CustomTheme,
  storage: Storage = localStorage,
): void {
  const others = readCustomThemes(storage).filter((t) => t.id !== theme.id);
  writeCustomThemes([...others, theme], storage);
}

/** Find a custom theme by id, or null when absent. */
export function findCustomThemeById(
  id: string,
  storage: Pick<Storage, 'getItem'> = localStorage,
): CustomTheme | null {
  return readCustomThemes(storage).find((t) => t.id === id) ?? null;
}

// Re-export the pure helpers so callers can import everything from here.
export { slugifyTheme, isReservedThemeId } from '../utils/customThemes';
export type { CustomTheme };

async function syncUpThemes(themes: CustomTheme[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const rows = themes.map((t) => ({
    id: t.id,
    user_id: uid,
    label: t.label,
    placeholder_title: t.placeholderTitle,
    placeholder_body: t.placeholderBody,
  }));
  const { error } = await supabase
    .from('custom_themes')
    .upsert(rows, { onConflict: 'user_id,id' });
  if (error) console.warn('[supabaseCustomThemes]', error.message);
}

/** Merge remote themes into localStorage (cloud wins per-id). Called on sign-in. */
export async function hydrateCustomThemes(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const { data, error } = await supabase
    .from('custom_themes')
    .select('*')
    .eq('user_id', uid);
  if (error) {
    console.warn('[supabaseCustomThemes]', error.message);
    return;
  }
  if (!data || data.length === 0) return;
  const remote: CustomTheme[] = data.map((r) => ({
    id: r.id,
    label: r.label,
    placeholderTitle: r.placeholder_title,
    placeholderBody: r.placeholder_body,
  }));
  const local = readCustomThemes();
  const byId = new Map(local.map((t) => [t.id, t]));
  for (const t of remote) byId.set(t.id, t);
  writeLocal([...byId.values()]);
}
