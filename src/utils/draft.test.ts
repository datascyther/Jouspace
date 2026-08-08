import { describe, it, expect } from 'vitest';
import { readDraft, writeDraft, clearDraft, type Draft } from './draft';

/** Minimal in-memory storage stand-in. */
function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('writeDraft / readDraft', () => {
  it('round-trips a draft through storage', () => {
    const storage = makeStorage();
    const draft: Draft = { title: 'Morning', body: 'A quiet thought.', theme: 'clarity', savedAt: 1234 };
    writeDraft(draft, storage);
    expect(readDraft(storage)).toEqual(draft);
  });

  it('returns null when nothing is stored', () => {
    expect(readDraft(makeStorage())).toBeNull();
  });

  it('returns null for a corrupt payload', () => {
    const storage = makeStorage({ 'jouspace:journal:draft': '{not json' });
    expect(readDraft(storage)).toBeNull();
  });

  it('returns null for a malformed payload (missing body)', () => {
    const storage = makeStorage({
      'jouspace:journal:draft': JSON.stringify({ title: 'T', theme: 'clarity' }),
    });
    expect(readDraft(storage)).toBeNull();
  });
});

describe('clearDraft', () => {
  it('removes the stored draft', () => {
    const storage = makeStorage();
    writeDraft({ title: 'T', body: 'B', theme: 'purpose', savedAt: 1 }, storage);
    clearDraft(storage);
    expect(readDraft(storage)).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    const throwing = {
      removeItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(() => clearDraft(throwing)).not.toThrow();
  });
});
