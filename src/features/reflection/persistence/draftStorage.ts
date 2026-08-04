/**
 * Journal draft persistence — a single in-progress draft per user, kept
 * client-side so the "Continue Draft" surface on the Hub can reopen it.
 *
 * Drafts are intentionally NOT synced to the backend; they are a local
 * convenience that is discarded once an entry is saved.
 */

import { storageService } from '@/services/storage';
import type { EmotionType } from '@/constants/emotions';

const getKey = (uid: string) => `journal_draft_${uid}`;

export interface JournalDraft {
  title: string;
  body: string;
  mood?: EmotionType | null;
  tags?: string[];
  updatedAt: number;
}

export async function loadDraft(uid: string | null): Promise<JournalDraft | null> {
  if (!uid) return null;
  return storageService.getJSON<JournalDraft>(getKey(uid));
}

export async function saveDraft(uid: string | null, draft: JournalDraft): Promise<void> {
  if (!uid) return;
  await storageService.setJSON(getKey(uid), draft);
}

export async function clearDraft(uid: string | null): Promise<void> {
  if (!uid) return;
  await storageService.delete(getKey(uid));
}
