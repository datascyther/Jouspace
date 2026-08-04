/**
 * JournalRepository — client-side, local-first cache for journal entries.
 *
 * Mirrors `MoodRepository`: the backend `JournalRepository` (in
 * backend/repositories) is the only Supabase touchpoint; this layer keeps an
 * offline copy so the Journal Hub renders instantly and writes survive a
 * flaky connection.
 *
 *   UI / screen → useSaveJournal → SyncStore(enqueue) → JournalRepository
 *              → backend JournalRepository → Supabase
 */

import { journalRepository as backendJournalRepo } from '../../backend/repositories/JournalRepository';
import type { JournalInput } from '../../backend/repositories/JournalRepository';
import { NotAuthenticatedError } from '../../backend/repositories/baseRepository';
import { storageService } from '@/services/storage';
import type { JournalRow } from '../../backend/services/JournalService';

const getLocalKey = (uid: string) => `journal_entries_${uid}`;

export class JournalRepository {
  async loadEntries(uid: string): Promise<JournalRow[]> {
    if (!uid) return [];

    const local = await this.loadFromLocal(uid);
    if (local.length > 0) return local;

    const cloud = await this.loadFromCloud();
    if (cloud.length > 0) {
      await this.persistEntries(uid, cloud);
    }
    return cloud;
  }

  async saveEntry(uid: string, input: JournalInput): Promise<JournalRow> {
    if (!uid) throw new Error('JournalRepository.saveEntry: uid required');

    const localRow: JournalRow = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      user_id: uid,
      title: input.title ?? null,
      body: input.body ?? null,
      mood_id: input.mood_id ?? null,
      attachments: input.attachments ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.persistEntries(uid, [localRow]);
    await this.syncToCloud(uid, localRow);
    return localRow;
  }

  async syncToCloud(uid: string, entry: JournalRow): Promise<JournalRow> {
    if (!uid) return entry;
    try {
      // Dedupe: if a byte-identical entry was already created (e.g. the queue
      // was interrupted and re-run after a restart), reuse it instead of
      // inserting a duplicate.
      const existing = await backendJournalRepo.list();
      const dup = existing.find(
        (e) =>
          e.title === entry.title &&
          e.body === entry.body &&
          Math.abs(
            new Date(e.created_at).getTime() - new Date(entry.created_at).getTime(),
          ) < 60_000,
      );
      if (dup) {
        await this.replaceLocal(entry.id, dup);
        return dup;
      }

      const created = await backendJournalRepo.create({
        title: entry.title ?? undefined,
        body: entry.body ?? undefined,
        mood_id: entry.mood_id ?? undefined,
        attachments: entry.attachments ?? undefined,
      });
      await this.replaceLocal(entry.id, created);
      return created;
    } catch (error) {
      if (error instanceof NotAuthenticatedError) return entry;
      // Network/socket failures must never surface to the UI — the local copy
      // is the source of truth and the queue retries later.
      console.warn('[JournalRepository] cloud sync skipped (will retry):', error);
      return entry;
    }
  }

  async syncFromCloud(uid: string): Promise<JournalRow[]> {
    if (!uid) return [];
    const cloud = await this.loadFromCloud();
    if (cloud.length > 0) {
      await this.persistEntries(uid, cloud);
    }
    return this.loadFromLocal(uid);
  }

  /** Patch a single local entry (merges by id) and return the updated row. */
  async updateLocal(uid: string, id: string, patch: Partial<JournalRow>): Promise<JournalRow | null> {
    if (!uid) return null;
    const existing = await this.loadFromLocal(uid);
    const idx = existing.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    const updated: JournalRow = {
      ...existing[idx],
      ...patch,
      id,
      updated_at: new Date().toISOString(),
    };
    await this.persistEntries(uid, [updated]);
    return updated;
  }

  /** Remove a single entry from the local offline cache. */
  async removeLocal(uid: string, id: string): Promise<void> {
    if (!uid) return;
    try {
      const key = getLocalKey(uid);
      const existing = (await storageService.getJSON<JournalRow[]>(key)) || [];
      await storageService.setJSON(key, existing.filter((e) => e.id !== id));
    } catch (err) {
      console.error('[JournalRepository] removeLocal failed:', err);
    }
  }

  async persistEntries(uid: string, entries: JournalRow[]): Promise<void> {
    if (!uid || entries.length === 0) return;
    try {
      const key = getLocalKey(uid);
      const existing = (await storageService.getJSON<JournalRow[]>(key)) || [];
      const merged = [...existing];
      for (const entry of entries) {
        const idx = merged.findIndex((m) => m.id === entry.id);
        if (idx >= 0) merged[idx] = entry;
        else merged.push(entry);
      }
      await storageService.setJSON(key, merged);
    } catch (err) {
      console.error('[JournalRepository] persist failed:', err);
    }
  }

  /** Drop a local optimistic row and store its canonical (cloud) replacement. */
  private async replaceLocal(localId: string, canonical: JournalRow): Promise<void> {
    try {
      const key = getLocalKey(canonical.user_id);
      const existing = (await storageService.getJSON<JournalRow[]>(key)) || [];
      const next = existing.filter((e) => e.id !== localId).concat(canonical);
      await storageService.setJSON(key, next);
    } catch (err) {
      console.error('[JournalRepository] replaceLocal failed:', err);
    }
  }

  private async loadFromLocal(uid: string): Promise<JournalRow[]> {
    try {
      return (await storageService.getJSON<JournalRow[]>(getLocalKey(uid))) || [];
    } catch {
      return [];
    }
  }

  private async loadFromCloud(): Promise<JournalRow[]> {
    try {
      return await backendJournalRepo.list();
    } catch (err) {
      console.error('[JournalRepository] cloud load failed:', err);
      return [];
    }
  }
}

export const journalRepository = new JournalRepository();
export default journalRepository;
