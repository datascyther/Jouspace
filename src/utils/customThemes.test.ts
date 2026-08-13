import { describe, it, expect } from 'vitest';
import {
  slugifyTheme,
  isReservedThemeId,
  readCustomThemes,
  writeCustomThemes,
  saveCustomTheme,
  findCustomThemeById,
  type CustomTheme,
} from './customThemes';

const sample: CustomTheme = {
  id: 'my_morning',
  label: 'My Morning',
  placeholderTitle: 'First light',
  placeholderBody: 'Today begins...',
};

function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
  };
}

describe('slugifyTheme', () => {
  it('lowercases and converts punctuation/spaces to underscores', () => {
    expect(slugifyTheme('My Morning!')).toBe('my_morning');
    expect(slugifyTheme('  Deep   Thoughts  ')).toBe('deep_thoughts');
    expect(slugifyTheme('Daily-Grounding')).toBe('daily_grounding');
  });

  it('strips leading/trailing underscores', () => {
    expect(slugifyTheme('!!hello!!')).toBe('hello');
  });

  it('returns empty for non-alphanumeric input', () => {
    expect(slugifyTheme('!!!')).toBe('');
  });
});

describe('isReservedThemeId', () => {
  it('reserves built-in themes', () => {
    expect(isReservedThemeId('clarity')).toBe(true);
    expect(isReservedThemeId('starting_again')).toBe(true);
  });

  it('reserves preset space ids', () => {
    expect(isReservedThemeId('journal')).toBe(true);
    expect(isReservedThemeId('release')).toBe(true);
  });

  it('does not reserve ordinary slugs', () => {
    expect(isReservedThemeId('my_morning')).toBe(false);
  });
});

describe('custom themes storage', () => {
  it('returns [] when nothing stored', () => {
    expect(readCustomThemes(makeStorage())).toEqual([]);
  });

  it('round-trips a list', () => {
    const storage = makeStorage();
    writeCustomThemes([sample], storage);
    expect(readCustomThemes(storage)).toEqual([sample]);
  });

  it('upserts by id via saveCustomTheme', () => {
    const storage = makeStorage();
    saveCustomTheme(sample, storage);
    const updated = { ...sample, label: 'Morning Pages' };
    saveCustomTheme(updated, storage);
    const list = readCustomThemes(storage);
    expect(list).toHaveLength(1);
    expect(list[0].label).toBe('Morning Pages');
  });

  it('finds by id', () => {
    const storage = makeStorage();
    saveCustomTheme(sample, storage);
    expect(findCustomThemeById('my_morning', storage)).toEqual(sample);
    expect(findCustomThemeById('nope', storage)).toBeNull();
  });

  it('ignores a corrupt payload', () => {
    const storage = makeStorage({ 'jouspace:spaces:custom': '{not json' });
    expect(readCustomThemes(storage)).toEqual([]);
  });

  it('drops malformed entries', () => {
    const storage = makeStorage({
      'jouspace:spaces:custom': JSON.stringify([
        sample,
        { id: 'bad', label: 'no placeholders' },
        'junk',
      ]),
    });
    expect(readCustomThemes(storage)).toEqual([sample]);
  });
});
