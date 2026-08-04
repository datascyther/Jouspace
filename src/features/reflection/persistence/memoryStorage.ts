/**
 * Memory storage — a client-side library of the user's curated memories.
 *
 * The Memory pillar is Pinecone-backed in Phase 2+ (JOURNAL_TECHNICAL_ARCHITECTURE.md);
 * until then, named memories live locally so the "Memory Library" works offline
 * without a schema migration. A memory is a meaningful journal moment the user
 * (or an AI suggestion they confirm) has named and kept.
 */

import { storageService } from '@/services/storage';

const getKey = (uid: string) => `jouspace_memories_${uid}`;

export interface MemoryItem {
  id: string;
  title: string;
  entryId?: string | null;
  snippet?: string;
  createdAt: number;
  source: 'user' | 'ai-suggested';
}

export async function loadMemories(uid: string | null): Promise<MemoryItem[]> {
  if (!uid) return [];
  try {
    const items = (await storageService.getJSON<MemoryItem[]>(getKey(uid))) || [];
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveMemories(uid: string, items: MemoryItem[]): Promise<void> {
  if (!uid) return;
  await storageService.setJSON(getKey(uid), items);
}

/** Append a memory, deduping by entryId so the same entry can't be added twice. */
export async function addMemory(
  uid: string,
  item: Omit<MemoryItem, 'id' | 'createdAt'>,
): Promise<MemoryItem[]> {
  const current = await loadMemories(uid);
  if (item.entryId && current.some((m) => m.entryId === item.entryId)) {
    return current;
  }
  const next: MemoryItem = {
    ...item,
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  const updated = [next, ...current];
  await saveMemories(uid, updated);
  return updated;
}

export async function removeMemory(uid: string, id: string): Promise<MemoryItem[]> {
  const current = await loadMemories(uid);
  const updated = current.filter((m) => m.id !== id);
  await saveMemories(uid, updated);
  return updated;
}
