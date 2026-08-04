/**
 * Jouspace — AI Runtime: Cache Manager
 *
 * Namespaced by capability so a weather query and a news query never collide.
 * Provides a fetch-through helper: getOrFetch returns the cached value on a
 * hit, otherwise calls the producer, stores the result, and returns it.
 */

import type { Capability } from '../types';
import { MemoryCache, type CacheStore } from './MemoryCache';
import { ttlFor } from './TTL';

export class CacheManager {
  private store: CacheStore;
  readonly hits: Capability[] = [];
  readonly misses: Capability[] = [];

  constructor(store?: CacheStore) {
    this.store = store ?? new MemoryCache();
  }

  private keyFor(capability: Capability, query: string): string {
    return `${capability}:${query.toLowerCase().trim()}`;
  }

  get<T>(capability: Capability, query: string): T | null {
    const hit = this.store.get<T>(this.keyFor(capability, query));
    if (hit !== null) {
      this.hits.push(capability);
      return hit;
    }
    this.misses.push(capability);
    return null;
  }

  set<T>(capability: Capability, query: string, value: T): void {
    this.store.set(this.keyFor(capability, query), value, ttlFor(capability));
  }

  /** Fetch-through: cache-first, then produce + store. */
  async getOrFetch<T>(
    capability: Capability,
    query: string,
    producer: () => Promise<T>,
  ): Promise<T> {
    const cached = this.get<T>(capability, query);
    if (cached !== null) return cached;
    const produced = await producer();
    this.set(capability, query, produced);
    return produced;
  }
}
