/**
 * supabaseSync — generic, local-first cloud-sync helper for single-row-per-user
 * tables (profiles, personalization, ai_chat_history, ai_context, user_prefs).
 *
 * Design (mirrors SupabaseJournalStore):
 *  - Synchronous reads from a localStorage cache (instant, works offline,
 *    preserves the synchronous call surface the app already depends on).
 *  - Synchronous writes to localStorage + an async fire-and-forget upsert to
 *    Supabase (only when configured AND a user is signed in).
 *  - On auth state change, hydrate from the cloud: the remote row (if present)
 *    is merged into localStorage so a fresh device / reinstall picks up the
 *    user's real data. Cloud wins for fields it actually has.
 *
 * When `isSupabaseConfigured` is false (no env keys, e.g. in tests or a
 * backend-less build) this degrades to pure localStorage — identical behavior
 * to the original modules, so existing tests keep passing.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { loadSession } from './auth';
import type { Database } from '../types/supabase';

type TableName = keyof Database['public']['Tables'];

export class SupabaseSyncStore<T> {
  private table: TableName;
  private storageKey: string;
  private defaults: T;
  private hydrated = false;
  private toRow: (local: T) => Record<string, unknown>;
  private fromRow: (row: Record<string, unknown>) => T;
  /** Column that holds the owner's auth user id (profiles uses `id`, others `user_id`). */
  private userIdColumn: string;
  private onConflict: string;

  constructor(
    table: TableName,
    storageKey: string,
    defaults: T,
    options?: {
      toRow?: (local: T) => Record<string, unknown>;
      fromRow?: (row: Record<string, unknown>) => T;
      /** Owner column name; defaults to `user_id`. Use `id` for the profiles table. */
      userIdColumn?: string;
      /** upsert conflict target; defaults to `user_id`. Use `id` for profiles. */
      onConflict?: string;
    },
  ) {
    this.table = table;
    this.storageKey = storageKey;
    this.defaults = defaults;
    this.toRow = options?.toRow ?? ((v) => v as unknown as Record<string, unknown>);
    this.fromRow = options?.fromRow ?? ((r) => r as unknown as T);
    this.userIdColumn = options?.userIdColumn ?? 'user_id';
    this.onConflict = options?.onConflict ?? 'user_id';

    if (isSupabaseConfigured) {
      // Re-hydrate whenever the session changes (sign-in / sign-out / refresh).
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) void this.hydrate();
      });
      void this.hydrate();
    }
  }

  /** Synchronous read from the local cache (localStorage). */
  read(): T {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return { ...this.defaults, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      /* corrupt payload → fall back to defaults */
    }
    return { ...this.defaults };
  }

  /** Synchronous write to localStorage + async cloud upsert. */
  write(value: T): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(value));
    } catch {
      /* storage failure (private mode / quota) — non-fatal */
    }
    void this.syncUp(value);
  }

  /** Remove the local key + async cloud delete (for tables keyed by user_id). */
  remove(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      /* non-fatal */
    }
    void this.syncDelete();
  }

  private async syncUp(value: T): Promise<void> {
    if (!isSupabaseConfigured) return;
    const uid = loadSession()?.id;
    if (!uid) return; // not signed in yet — local write only, hydrate later
    const row = { ...this.toRow(value), [this.userIdColumn]: uid } as Record<string, unknown>;
    const { error } = await supabase
      .from(this.table)
      .upsert(row as never, { onConflict: this.onConflict });
    if (error) console.warn('[supabaseSync]', this.table, error.message);
  }

  private async syncDelete(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const uid = loadSession()?.id;
    if (!uid) return;
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq(this.userIdColumn, uid);
    if (error) console.warn('[supabaseSync]', this.table, error.message);
  }

  /** Pull the remote row into localStorage (cloud wins for present fields). */
  async hydrate(): Promise<void> {
    if (!isSupabaseConfigured || this.hydrated) return;
    const uid = loadSession()?.id;
    if (!uid) return;
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq(this.userIdColumn, uid)
      .maybeSingle();
    if (error) {
      console.warn('[supabaseSync]', this.table, error.message);
      return;
    }
    if (!data) {
      this.hydrated = true;
      return;
    }
    const merged = { ...this.defaults, ...this.fromRow(data as Record<string, unknown>) };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(merged));
    } catch {
      /* non-fatal */
    }
    this.hydrated = true;
  }
}
