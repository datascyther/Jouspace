/**
 * SupabaseJournalStore — cloud-backed implementation of the JournalStore
 * interface defined in ./JournalStore.ts.
 *
 * Design: keep the same synchronous call surface the rest of the app depends on
 * (list/get/save/remove/subscribe) by maintaining an in-memory cache plus a
 * localStorage mirror (instant UX, works offline). Behind the scenes it syncs
 * with Supabase Postgres (RLS-scoped to the user) and subscribes to realtime
 * changes for live multi-device sync.
 *
 * On first sign-in it uploads any existing local-only entries, then merges the
 * remote set. After that, every local write is mirrored to the cloud.
 */

import type { Database } from '../types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { StorageQuotaError } from './JournalStore';
import type { StoredEntry, NewEntryInput } from './types';

const MIRROR_KEY = 'jouspace:journal:cloud:v1';

type EntryRow = Database['public']['Tables']['journal_entries']['Row'];

function rowToEntry(r: EntryRow): StoredEntry {
  return {
    id: r.id,
    date: r.date,
    title: r.title,
    theme: r.theme,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function entryToRow(
  e: StoredEntry,
  userId: string,
): Database['public']['Tables']['journal_entries']['Insert'] {
  return {
    id: e.id,
    user_id: userId,
    date: e.date,
    title: e.title,
    theme: e.theme,
    content: e.content,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

export class SupabaseJournalStore {
  private listeners = new Set<() => void>();
  private errorListeners = new Set<(err: StorageQuotaError) => void>();
  private cache: StoredEntry[] | null = null;
  private realtime: RealtimeChannel | null = null;
  private hydrated = false;

  constructor() {
    if (isSupabaseConfigured) {
      // Hydrate + keep in sync once a session exists.
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) void this.hydrate();
        else this.teardownRealtime();
      });
      void this.hydrate();
    }
  }

  // ── Local mirror (offline + instant reads) ──────────────────────────────────
  private readLocal(): StoredEntry[] {
    try {
      const raw = localStorage.getItem(MIRROR_KEY);
      return raw ? (JSON.parse(raw) as StoredEntry[]) : [];
    } catch {
      return [];
    }
  }

  private persistLocal(entries: StoredEntry[]): void {
    try {
      localStorage.setItem(MIRROR_KEY, JSON.stringify(entries));
    } catch {
      this.emitError(new StorageQuotaError());
    }
  }

  private ensureCache(): StoredEntry[] {
    if (this.cache) return this.cache;
    this.cache = this.readLocal();
    return this.cache;
  }

  // ── Hydration + sync ─────────────────────────────────────────────────────────
  async hydrate(): Promise<void> {
    if (!isSupabaseConfigured || this.hydrated) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id);
    if (error) {
      this.emitError(new StorageQuotaError('Could not sync your journal.'));
      return;
    }
    this.hydrated = true;

    const remote = (data ?? []).map(rowToEntry);
    const remoteIds = new Set(remote.map((e) => e.id));
    const localOnly = this.ensureCache().filter((e) => !remoteIds.has(e.id));

    // Upload any entries that existed locally before the account was created.
    if (localOnly.length > 0) {
      const { error: upErr } = await supabase
        .from('journal_entries')
        .upsert(localOnly.map((e) => entryToRow(e, user.id)), {
          onConflict: 'id',
        });
      if (upErr) this.emitError(new StorageQuotaError('Sync incomplete.'));
    }

    const merged = [...remote];
    for (const local of localOnly) {
      if (!merged.some((m) => m.id === local.id)) merged.push(local);
    }
    // Newest-first by updatedAt.
    merged.sort((a, b) => b.updatedAt - a.updatedAt);

    this.cache = merged;
    this.persistLocal(merged);
    this.emit();
    this.subscribeRealtime(user.id);
  }

  private subscribeRealtime(userId: string): void {
    this.teardownRealtime();
    const channel = supabase
      .channel(`journal:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => this.applyRealtime(payload),
      )
      .subscribe();
    this.realtime = channel;
  }

  private teardownRealtime(): void {
    if (this.realtime) {
      supabase.removeChannel(this.realtime);
      this.realtime = null;
    }
  }

  private applyRealtime(payload: {
    eventType: string;
    new: EntryRow;
    old: Partial<EntryRow>;
  }): void {
    const cache = this.ensureCache();
    if (payload.eventType === 'DELETE') {
      const id = payload.old.id;
      this.cache = cache.filter((e) => e.id !== id);
    } else {
      const incoming = rowToEntry(payload.new);
      const idx = cache.findIndex((e) => e.id === incoming.id);
      if (idx >= 0) cache[idx] = incoming;
      else cache.push(incoming);
      cache.sort((a, b) => b.updatedAt - a.updatedAt);
      this.cache = cache;
    }
    this.persistLocal(this.cache);
    this.emit();
  }

  // ── JournalStore interface ───────────────────────────────────────────────────
  list(): StoredEntry[] {
    return [...this.ensureCache()].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): StoredEntry | undefined {
    return this.ensureCache().find((e) => e.id === id);
  }

  save(input: NewEntryInput): StoredEntry {
    const now = Date.now();
    const existing = input.id ? this.get(input.id) : undefined;
    const entry: StoredEntry = {
      id: input.id ?? crypto.randomUUID(),
      date: input.date,
      title: input.title,
      theme: input.theme,
      content: input.content,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const cache = this.ensureCache().filter((e) => e.id !== entry.id);
    cache.push(entry);
    cache.sort((a, b) => b.updatedAt - a.updatedAt);
    this.cache = cache;
    this.persistLocal(cache);
    this.emit();

    void this.syncUpsert(entry);
    return entry;
  }

  remove(id: string): boolean {
    const cache = this.ensureCache().filter((e) => e.id !== id);
    const changed = cache.length !== this.ensureCache().length;
    this.cache = cache;
    this.persistLocal(cache);
    this.emit();
    if (changed) void this.syncDelete(id);
    return changed;
  }

  private async syncUpsert(entry: StoredEntry): Promise<void> {
    if (!isSupabaseConfigured) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('journal_entries')
      .upsert(entryToRow(entry, user.id), { onConflict: 'id' });
    if (error) this.emitError(new StorageQuotaError('Change not synced.'));
  }

  private async syncDelete(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) this.emitError(new StorageQuotaError('Delete not synced.'));
  }

  // Seed demo entries (Profile → "Load sample data"). Works exactly like the
  // local store: merges into the current set and syncs.
  loadDemo(entries: StoredEntry[]): void {
    const byId = new Map(this.ensureCache().map((e) => [e.id, e]));
    for (const e of entries) byId.set(e.id, e);
    const merged = [...byId.values()].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    this.cache = merged;
    this.persistLocal(merged);
    this.emit();
    for (const e of entries) void this.syncUpsert(e);
  }

  exportAll() {
    const entries = this.ensureCache();
    return {
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      entries,
    };
  }

  importEntries(entries: StoredEntry[], mode: 'replace' | 'merge'): void {
    if (mode === 'replace') {
      this.cache = [...entries];
    } else {
      const byId = new Map(this.ensureCache().map((e) => [e.id, e]));
      for (const e of entries) byId.set(e.id, e);
      this.cache = [...byId.values()];
    }
    this.cache.sort((a, b) => b.updatedAt - a.updatedAt);
    this.persistLocal(this.cache);
    this.emit();
    for (const e of entries) void this.syncUpsert(e);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeError(listener: (err: StorageQuotaError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  private emitError(err: StorageQuotaError): void {
    this.errorListeners.forEach((l) => l(err));
    console.error('[SupabaseJournalStore]', err);
  }
}
