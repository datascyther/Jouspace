/**
 * supabaseAiContext — cloud-backed AI context selection (ai_context table).
 *
 * The `ai_context` table stores one row per user with a `selection` jsonb column
 * holding the currently-selected AI context item `{ id, label }`. This module
 * mirrors the localStorage key `jouspace:ai:context` to Supabase: reads stay
 * synchronous from localStorage; writes are fire-and-forget upserts; on sign-in
 * the remote row is hydrated into localStorage (cloud wins).
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { loadSession } from '../lib/auth';
import type { Json } from '../types/supabase';

export const AI_CONTEXT_KEY = 'jouspace:ai:context';

export interface AiContextSelection {
  id: string;
  label: string;
}

/** Synchronous read from the local mirror (unchanged behavior). */
export function loadAiContext(): AiContextSelection | null {
  try {
    const raw = localStorage.getItem(AI_CONTEXT_KEY);
    if (raw) return JSON.parse(raw) as AiContextSelection;
  } catch {
    /* ignore corrupt payload */
  }
  return null;
}

/** Synchronous write to localStorage + async cloud upsert. */
export function saveAiContext(selection: AiContextSelection): void {
  try {
    localStorage.setItem(AI_CONTEXT_KEY, JSON.stringify(selection));
  } catch {
    /* ignore storage failure */
  }
  void syncUp(selection);
}

/** Clear the AI context locally + in the cloud. */
export function clearAiContext(): void {
  try {
    localStorage.removeItem(AI_CONTEXT_KEY);
  } catch {
    /* non-fatal */
  }
  void syncDelete();
}

async function syncUp(selection: AiContextSelection): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const { error } = await supabase.from('ai_context').upsert(
    { user_id: uid, selection: selection as unknown as Json },
    { onConflict: 'user_id' },
  );
  if (error) console.warn('[supabaseAiContext]', error.message);
}

async function syncDelete(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const { error } = await supabase
    .from('ai_context')
    .delete()
    .eq('user_id', uid);
  if (error) console.warn('[supabaseAiContext]', error.message);
}

/** Pull the remote AI context into localStorage (cloud wins). Called on sign-in. */
export async function hydrateAiContext(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const { data, error } = await supabase
    .from('ai_context')
    .select('selection')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) {
    console.warn('[supabaseAiContext]', error.message);
    return;
  }
  if (!data) return;
  try {
    localStorage.setItem(AI_CONTEXT_KEY, JSON.stringify(data.selection ?? null));
  } catch {
    /* non-fatal */
  }
}
