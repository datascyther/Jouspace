/**
 * Jouspace — AI Runtime: Cache TTL policy
 *
 * Provider-specific TTLs (seconds). Validates the Search → Cache → Return
 * pattern with zero infrastructure. Swap MemoryCache for Vercel KV later
 * without touching callers. Never use Supabase as a cache.
 */

import { Capability } from '../types';

export const TTL: Record<string, number> = {
  [Capability.WEATHER]: 600, // 10 min
  [Capability.NEWS]: 300, // 5 min
  [Capability.KNOWLEDGE]: 86400, // 24 hr
  [Capability.MEDICAL]: 86400, // 24 hr
  [Capability.RAG]: 3600, // 1 hr
};

export function ttlFor(capability: Capability): number {
  return TTL[capability] ?? 300;
}
