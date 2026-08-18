import { describe, it, expect } from 'vitest';
import {
  readAiComposerDraft,
  writeAiComposerDraft,
  clearAiComposerDraft,
} from './aiDraft';

/** Minimal in-memory storage stand-in. */
function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('writeAiComposerDraft / readAiComposerDraft', () => {
  it('round-trips unsaved composer text through storage', () => {
    const storage = makeStorage();
    writeAiComposerDraft('half-typed thought…', storage);
    expect(readAiComposerDraft(storage)).toBe('half-typed thought…');
  });

  it('returns an empty string when nothing is stored', () => {
    expect(readAiComposerDraft(makeStorage())).toBe('');
  });

  it('caps over-long drafts so they can never blow the quota', () => {
    const storage = makeStorage();
    writeAiComposerDraft('x'.repeat(100_000), storage);
    expect(readAiComposerDraft(storage).length).toBe(50_000);
  });

  it('does not throw when storage is unavailable', () => {
    const throwing = {
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(() => writeAiComposerDraft('text', throwing)).not.toThrow();
  });
});

describe('clearAiComposerDraft', () => {
  it('removes the stored composer draft', () => {
    const storage = makeStorage();
    writeAiComposerDraft('draft text', storage);
    clearAiComposerDraft(storage);
    expect(readAiComposerDraft(storage)).toBe('');
  });

  it('does not throw when storage is unavailable', () => {
    const throwing = {
      removeItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(() => clearAiComposerDraft(throwing)).not.toThrow();
  });
});
