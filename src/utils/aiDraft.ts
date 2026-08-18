/**
 * AI composer draft persistence: an unsaved message in the AI chat composer
 * survives a remount (tab switch, refresh elsewhere, reload) so a half-typed
 * thought is never lost. Cleared once the message is sent.
 *
 * Mirrors the journal draft idiom (`utils/draft.ts`): corrupt-safe reads,
 * best-effort writes, and a size cap so a pathological value can never blow
 * the storage quota.
 */

const AI_DRAFT_STORAGE_KEY = 'jouspace:ai:composer:draft';
const MAX_DRAFT_LENGTH = 50_000;

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;
type RemovableStorage = Pick<Storage, 'removeItem'>;

/** Read the persisted AI composer draft, or '' when absent/invalid. */
export function readAiComposerDraft(
  storage: ReadableStorage = localStorage
): string {
  try {
    const raw = storage.getItem(AI_DRAFT_STORAGE_KEY);
    if (typeof raw === 'string' && raw.length <= MAX_DRAFT_LENGTH) return raw;
  } catch {
    /* ignore storage failure */
  }
  return '';
}

/** Persist the AI composer draft (best-effort; ignores storage failures). */
export function writeAiComposerDraft(
  text: string,
  storage: WritableStorage = localStorage
): void {
  try {
    storage.setItem(
      AI_DRAFT_STORAGE_KEY,
      typeof text === 'string' && text.length > MAX_DRAFT_LENGTH
        ? text.slice(0, MAX_DRAFT_LENGTH)
        : text
    );
  } catch {
    /* ignore storage failure (private mode, quota, etc.) */
  }
}

/** Remove the persisted AI composer draft (called after the message is sent). */
export function clearAiComposerDraft(
  storage: RemovableStorage = localStorage
): void {
  try {
    storage.removeItem(AI_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore storage failure */
  }
}