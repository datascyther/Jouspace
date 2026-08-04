import { describe, it, expect } from 'vitest';
import { CacheManager } from './CacheManager';
import { MemoryCache } from './MemoryCache';
import { TTL } from './TTL';
import { Capability } from '../types';

describe('CacheManager', () => {
  it('miss then hit within TTL', async () => {
    const cm = new CacheManager(new MemoryCache());
    const producer = async () => 'fresh';
    const first = await cm.getOrFetch(Capability.NEWS, 'ai news', producer);
    const second = await cm.getOrFetch(Capability.NEWS, 'ai news', producer);
    expect(first).toBe('fresh');
    expect(second).toBe('fresh');
    expect(cm.hits).toContain(Capability.NEWS);
    expect(cm.misses).toContain(Capability.NEWS);
  });

  it('expired entries re-fetch', async () => {
    const store = new MemoryCache();
    const cm = new CacheManager(store);
    store.set('WEATHER:current', 'old', -1); // already expired
    const got = await cm.getOrFetch(Capability.WEATHER, 'current', async () => 'new');
    expect(got).toBe('new');
  });

  it('namespaces by capability', () => {
    const cm = new CacheManager(new MemoryCache());
    cm.set(Capability.WEATHER, 'x', 'wx');
    cm.set(Capability.NEWS, 'x', 'news');
    expect(cm.get(Capability.WEATHER, 'x')).toBe('wx');
    expect(cm.get(Capability.NEWS, 'x')).toBe('news');
  });

  it('TTL map covers capabilities', () => {
    expect(TTL[Capability.KNOWLEDGE]).toBe(86400);
    expect(TTL[Capability.WEATHER]).toBe(600);
    expect(TTL[Capability.NEWS]).toBe(300);
  });
});
