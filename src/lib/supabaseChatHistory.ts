/**
 * supabaseChatHistory — cloud-backed AI chat history (ai_chat_history table).
 *
 * The `ai_chat_history` table stores one row per user with a `messages` jsonb
 * column (the full conversation array). This module mirrors the localStorage
 * chat history (`jouspace:ai:chat:messages`) to Supabase: reads stay
 * synchronous from localStorage; writes are fire-and-forget upserts; on sign-in
 * the remote row is hydrated into localStorage (cloud wins).
 *
 * The `IntelligenceMessage` shape is unchanged so `useJouspaceIntelligence`
 * and `AIHistorySheet` keep working.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { loadSession } from '../lib/auth';
import type { IntelligenceMessage } from '../hooks/useJouspaceIntelligence';
import type { Json } from '../types/supabase';

export const CHAT_STORAGE_KEY = 'jouspace:ai:chat:messages';

/** Synchronous read from the local mirror (unchanged behavior). */
export function loadChatMessages(): IntelligenceMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as IntelligenceMessage[];
  } catch {
    /* corrupt JSON → start clean */
  }
  return [];
}

/** Synchronous write to localStorage + async cloud upsert. */
export function saveChatMessages(messages: IntelligenceMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* storage failure → non-fatal */
  }
  void syncUp(messages);
}

/** Clear the chat history locally + in the cloud. */
export function clearChatMessages(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
  void syncDelete();
}

async function syncUp(messages: IntelligenceMessage[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const { error } = await supabase.from('ai_chat_history').upsert(
    { user_id: uid, messages: messages as unknown as Json },
    { onConflict: 'user_id' },
  );
  if (error) console.warn('[supabaseChatHistory]', error.message);
}

async function syncDelete(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const { error } = await supabase
    .from('ai_chat_history')
    .delete()
    .eq('user_id', uid);
  if (error) console.warn('[supabaseChatHistory]', error.message);
}

/** Pull the remote chat history into localStorage (cloud wins). Called on sign-in. */
export async function hydrateChatHistory(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = loadSession()?.id;
  if (!uid) return;
  const { data, error } = await supabase
    .from('ai_chat_history')
    .select('messages')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) {
    console.warn('[supabaseChatHistory]', error.message);
    return;
  }
  if (!data) return;
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data.messages ?? []));
  } catch {
    /* non-fatal */
  }
}
