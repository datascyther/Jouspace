/**
 * supabaseUserPrefs — cloud-backed user preferences (user_prefs table).
 *
 * The `user_prefs` table is one row per user consolidating: reminders_enabled,
 * theme, nav, draft, runtime_url, onboarded, and permissions. Each of these is
 * still stored under its own localStorage key on-device (so the existing
 * synchronous modules work unchanged); this module reads the full composite
 * from those keys and mirrors it to the `user_prefs` row, and hydrates the
 * cloud row back into the per-key localStorage entries on sign-in.
 *
 * Sync is debounced so rapid writes (e.g. draft autosave) coalesce into a
 * single upsert. When Supabase is unconfigured this is a no-op.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { loadSession } from '../lib/auth';
import type { Json } from '../types/supabase';

// Per-field localStorage keys (must match the owning modules).
const KEY_THEME = 'jouspace:theme';
const KEY_NAV = 'jouspace:nav';
const KEY_DRAFT = 'jouspace:journal:draft';
const KEY_REMINDERS = 'jouspace:reminders:v1';
const KEY_ONBOARDED = 'jouspace.onboarded';
const KEY_PERMISSIONS = 'jouspace.permissions.v1';
const KEY_RUNTIME_URL = 'jouspace:runtimeUrl';

function parse<T>(key: string): { found: boolean; value: T | undefined } {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { found: false, value: undefined };
    return { found: true, value: JSON.parse(raw) as T };
  } catch {
    return { found: false, value: undefined };
  }
}

function readString(key: string): { found: boolean; value: string | null } {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { found: false, value: null };
    return { found: true, value: raw };
  } catch {
    return { found: false, value: null };
  }
}

/** Build the user_prefs row from the per-key localStorage values. Only fields
 *  whose localStorage key is present are included, so syncing one field (e.g. a
 *  theme change) never clobbers another (e.g. onboarded) on a fresh device. */
function buildRow(uid: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: uid };

  const theme = readString(KEY_THEME);
  if (theme.found) row.theme = theme.value;

  const nav = parse<Json>(KEY_NAV);
  if (nav.found) row.nav = nav.value ?? {};

  const draft = parse<Json>(KEY_DRAFT);
  if (draft.found) row.draft = draft.value ?? {};

  const reminders = parse<{ enabled?: boolean }>(KEY_REMINDERS);
  if (reminders.found) row.reminders_enabled = reminders.value?.enabled !== false;

  const onb = readString(KEY_ONBOARDED);
  if (onb.found) row.onboarded = onb.value === '1';

  const perms = parse<Json>(KEY_PERMISSIONS);
  if (perms.found) row.permissions = perms.value ?? {};

  const runtime = readString(KEY_RUNTIME_URL);
  if (runtime.found) row.runtime_url = (runtime.value ?? '').trim() || null;

  return row;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced async upsert of the full user_prefs row. */
export function queueUserPrefsSync(): void {
  if (!isSupabaseConfigured) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncNow();
  }, 600);
}

async function syncNow(): Promise<void> {
  const uid = loadSession()?.id;
  if (!uid) return;
  const row = buildRow(uid);
  if (Object.keys(row).length <= 1) return; // nothing but user_id
  const { error } = await supabase
    .from('user_prefs')
    .upsert(row as never, { onConflict: 'user_id' });
  if (error) console.warn('[supabaseUserPrefs]', error.message);
}

/** Pull the remote user_prefs row into the per-field localStorage keys. */
export async function hydrateUserPrefs(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const { data, error } = await supabase
    .from('user_prefs')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) {
    console.warn('[supabaseUserPrefs]', error.message);
    return;
  }
  if (!data) return;

  if (typeof data.theme === 'string') {
    try { localStorage.setItem(KEY_THEME, data.theme); } catch { /* non-fatal */ }
  }
  if (data.nav !== undefined && data.nav !== null) {
    try { localStorage.setItem(KEY_NAV, JSON.stringify(data.nav)); } catch { /* non-fatal */ }
  }
  if (data.draft !== undefined && data.draft !== null) {
    try { localStorage.setItem(KEY_DRAFT, JSON.stringify(data.draft)); } catch { /* non-fatal */ }
  }
  if (typeof data.reminders_enabled === 'boolean') {
    try { localStorage.setItem(KEY_REMINDERS, JSON.stringify({ enabled: data.reminders_enabled })); } catch { /* non-fatal */ }
  }
  if (typeof data.onboarded === 'boolean') {
    try { localStorage.setItem(KEY_ONBOARDED, data.onboarded ? '1' : '0'); } catch { /* non-fatal */ }
  }
  if (data.permissions !== undefined && data.permissions !== null) {
    try { localStorage.setItem(KEY_PERMISSIONS, JSON.stringify(data.permissions)); } catch { /* non-fatal */ }
  }
  if (typeof data.runtime_url === 'string' && data.runtime_url.trim()) {
    try { localStorage.setItem(KEY_RUNTIME_URL, data.runtime_url); } catch { /* non-fatal */ }
  }
}