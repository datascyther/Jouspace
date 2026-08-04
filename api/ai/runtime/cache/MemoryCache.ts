/**
 * Jouspace — AI Runtime: In-memory TTL Cache
 *
 * Phase 7.1 MVP. A simple Map with per-entry expiry. Not shared across edge
 * instances — sufficient to validate the caching pattern. Replace with Vercel
 * KV / Upstash in Phase 7.2 by implementing the same CacheStore interface.
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStore {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlSeconds: number): void;
  has(key: string): boolean;
}

export class MemoryCache implements CacheStore {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}
