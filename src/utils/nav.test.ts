import { describe, it, expect } from 'vitest';
import { readStoredNav, writeStoredNav, type NavState } from './nav';

/** Minimal in-memory storage stand-in. */
function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe('readStoredNav', () => {
  it('returns Home when nothing is stored', () => {
    expect(readStoredNav(makeStorage())).toEqual({ screen: 'home', tab: 'home' });
  });

  it('restores a valid stored screen and tab', () => {
    const storage = makeStorage({
      'jouspace:nav': JSON.stringify({ screen: 'ai', tab: 'ai' }),
    });
    expect(readStoredNav(storage)).toEqual({ screen: 'ai', tab: 'ai' });
  });

  it('falls back per-field to Home when a value is invalid', () => {
    const storage = makeStorage({
      'jouspace:nav': JSON.stringify({ screen: 'spaceship', tab: 'ai' }),
    });
    expect(readStoredNav(storage)).toEqual({ screen: 'home', tab: 'ai' });
  });

  it('falls back entirely on a corrupt payload', () => {
    const storage = makeStorage({ 'jouspace:nav': '{not json' });
    expect(readStoredNav(storage)).toEqual({ screen: 'home', tab: 'home' });
  });
});

describe('writeStoredNav', () => {
  it('persists the nav state as JSON', () => {
    const storage = makeStorage();
    const state: NavState = { screen: 'memory', tab: 'memory' };
    writeStoredNav(state, storage);
    expect(storage.getItem('jouspace:nav')).toBe(JSON.stringify(state));
    // And it round-trips through the reader.
    expect(readStoredNav(storage)).toEqual(state);
  });

  it('does not throw when storage is unavailable', () => {
    const throwing = {
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(() => writeStoredNav({ screen: 'home', tab: 'home' }, throwing)).not.toThrow();
  });
});
