/**
 * rateLimit.ts — in-memory anonymous rate limiter (Worker port of server/rateLimit.ts).
 *
 * Same token-bucket + per-user concurrency + global concurrency design, but:
 *  - hashing uses Web Crypto (subtle.digest) instead of Node crypto.
 *  - reads NODE_ENV-equivalent from a passed `enabled` flag (Workers have no
 *    NODE_ENV; we disable in local `wrangler dev` by leaving it off).
 *
 * Note: Workers are ephemeral / multi-isolate, so counters are per-isolate and
 * don't aggregate across instances — acceptable for a free personal deployment
 * (same caveat as the Docker version's "keep min_instances=1" note).
 */

export type RateCapabilityKind = 'conversational' | 'generative';

export interface RateLimitConfig {
  conversationalTokens: number;
  conversationalWindowMs: number;
  generativeTokens: number;
  generativeWindowMs: number;
  perUserConcurrency: number;
  globalConcurrency: number;
  enabled: boolean;
}

const DEFAULT_RATE_CONFIG: RateLimitConfig = {
  conversationalTokens: 30,
  conversationalWindowMs: 10 * 60_000,
  generativeTokens: 10,
  generativeWindowMs: 10 * 60_000,
  perUserConcurrency: 2,
  globalConcurrency: 12,
  enabled: true,
};

export function normalizeKey(raw: string | undefined | null, fallback: string): string {
  const source = (raw ?? fallback ?? 'anonymous').toString();
  const cleaned = source.replace(/[^\x20-\x7E]/g, '').slice(0, 128);
  return cleaned || 'anonymous';
}

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface Bucket {
  tokens: number;
  lastRefill: number;
  activeStreams: number;
}

export interface AcquireResult {
  ok: boolean;
  retryAfterSec: number;
  key: string;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private globalActive = 0;

  constructor(private readonly config: RateLimitConfig = DEFAULT_RATE_CONFIG, private readonly now: () => number = Date.now) {}

  private refill(b: Bucket, capacity: number, windowMs: number): void {
    const t = this.now();
    const elapsed = t - b.lastRefill;
    if (elapsed <= 0) return;
    b.tokens = Math.min(capacity, b.tokens + (elapsed / windowMs) * capacity);
    b.lastRefill = t;
  }

  async acquire(rawKey: string, kind: RateCapabilityKind): Promise<AcquireResult> {
    const key = await hashKey(normalizeKey(rawKey, 'anonymous'));
    if (!this.config.enabled) return { ok: true, retryAfterSec: 0, key };

    const cfg =
      kind === 'conversational'
        ? { capacity: this.config.conversationalTokens, windowMs: this.config.conversationalWindowMs }
        : { capacity: this.config.generativeTokens, windowMs: this.config.generativeWindowMs };

    let b = this.buckets.get(key);
    if (!b) {
      b = { tokens: cfg.capacity, lastRefill: this.now(), activeStreams: 0 };
      this.buckets.set(key, b);
    }

    if (b.activeStreams >= this.config.perUserConcurrency) return { ok: false, retryAfterSec: 5, key };
    if (this.globalActive >= this.config.globalConcurrency) return { ok: false, retryAfterSec: 5, key };

    this.refill(b, cfg.capacity, cfg.windowMs);
    if (b.tokens < 1) {
      const deficit = 1 - b.tokens;
      const msPerToken = cfg.windowMs / cfg.capacity;
      const retryAfterSec = Math.max(1, Math.ceil((deficit * msPerToken) / 1000));
      return { ok: false, retryAfterSec, key };
    }

    b.tokens -= 1;
    b.activeStreams += 1;
    this.globalActive += 1;
    return { ok: true, retryAfterSec: 0, key };
  }

  release(key: string): void {
    if (!this.config.enabled) return;
    const b = this.buckets.get(key);
    if (b && b.activeStreams > 0) b.activeStreams -= 1;
    if (this.globalActive > 0) this.globalActive -= 1;
  }
}

export const rateLimiter = new RateLimiter();
