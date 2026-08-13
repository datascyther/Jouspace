/**
 * rateLimit.ts — Anonymous, in-memory rate limiting (anti-abuse)
 *
 * Pure module: no express dependency so it is fully unit-testable.
 *
 * Design:
 *  - Per-user token bucket keyed by the anonymous X-User-Id (fallback req.ip).
 *    Token buckets bound casual abuse; a spoofable ID means this is only the
 *    first line of defense.
 *  - A GLOBAL concurrency ceiling is the real backstop: even if every request
 *    uses a fresh ID, total simultaneous streams (and thus NVIDIA spend) is
 *    capped. This is the accepted mitigation until accounts/moderation land.
 *  - Only active in production (NODE_ENV === 'production'). RATE_LIMIT_DISABLED=1
 *    forces it off (e.g. local dev via `npm run dev`).
 *
 * Note: in-memory counters are per-process. During a Fly zero-downtime deploy
 * (two instances briefly live) or if scaled > 1, caps effectively double and
 * don't aggregate. Keep min_machines_running=1; move to Redis when scaling out.
 */

export type RateCapabilityKind = 'conversational' | 'generative';

export interface RateLimitConfig {
  /** Per-user token bucket: conversational (chat, reflect) */
  conversationalTokens: number;
  conversationalWindowMs: number;
  /** Per-user token bucket: generative (insight, summarize, memory) */
  generativeTokens: number;
  generativeWindowMs: number;
  /** Max simultaneous streams per user */
  perUserConcurrency: number;
  /** Max simultaneous streams globally */
  globalConcurrency: number;
  /** When false, acquire() always allows. */
  enabled: boolean;
}

export const DEFAULT_RATE_CONFIG: RateLimitConfig = {
  conversationalTokens: 30,
  conversationalWindowMs: 10 * 60_000, // 30 per 10 min
  generativeTokens: 10,
  generativeWindowMs: 10 * 60_000, // 10 per 10 min
  perUserConcurrency: 2,
  globalConcurrency: 12,
  enabled: process.env.NODE_ENV === 'production' && process.env.RATE_LIMIT_DISABLED !== '1',
};

interface Bucket {
  tokens: number;
  lastRefill: number;
  activeStreams: number;
}

export interface AcquireResult {
  ok: boolean;
  /** When ok=false, seconds the client should wait before retrying. */
  retryAfterSec: number;
  /** Opaque key to pass to release() once the stream ends. */
  key: string;
}

/**
 * Normalize/truncate an untrusted key. The X-User-Id is client-supplied, so we
 * never treat it as anything but an opaque ASCII token; anything else (incl.
 * req.ip, which may be a long IPv6 string) is hashed to a bounded length.
 */
export function normalizeKey(raw: string | undefined, fallback: string): string {
  const source = (raw ?? fallback ?? 'anonymous').toString();
  // Strip control chars / newlines; keep printable ASCII; cap length.
  const cleaned = source.replace(/[^\x20-\x7E]/g, '').slice(0, 128);
  return cleaned || 'anonymous';
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private globalActive = 0;

  constructor(
    private readonly config: RateLimitConfig = DEFAULT_RATE_CONFIG,
    private readonly now: () => number = Date.now
  ) {}

  /** Test helper: reset all counters. */
  reset(): void {
    this.buckets.clear();
    this.globalActive = 0;
  }

  private getBucket(key: string): Bucket {
    let b = this.buckets.get(key);
    if (!b) {
      b = { tokens: 0, lastRefill: this.now(), activeStreams: 0 };
      this.buckets.set(key, b);
    }
    return b;
  }

  private refill(b: Bucket, capacity: number, windowMs: number): void {
    const t = this.now();
    const elapsed = t - b.lastRefill;
    if (elapsed <= 0) return;
    const added = (elapsed / windowMs) * capacity;
    b.tokens = Math.min(capacity, b.tokens + added);
    b.lastRefill = t;
  }

  /** Attempt to acquire a request slot + token for the given capability kind. */
  acquire(key: string, kind: RateCapabilityKind): AcquireResult {
    if (!this.config.enabled) {
      return { ok: true, retryAfterSec: 0, key };
    }

    const cfg =
      kind === 'conversational'
        ? {
            capacity: this.config.conversationalTokens,
            windowMs: this.config.conversationalWindowMs,
          }
        : {
            capacity: this.config.generativeTokens,
            windowMs: this.config.generativeWindowMs,
          };

    const bucket =
      this.buckets.get(key) ??
      (() => {
        const b: Bucket = { tokens: cfg.capacity, lastRefill: this.now(), activeStreams: 0 };
        this.buckets.set(key, b);
        return b;
      })();

    // 1. Concurrency first (so we never consume a token for a rejected stream).
    if (bucket.activeStreams >= this.config.perUserConcurrency) {
      return { ok: false, retryAfterSec: 5, key };
    }
    if (this.globalActive >= this.config.globalConcurrency) {
      return { ok: false, retryAfterSec: 5, key };
    }

    // 2. Token bucket.
    this.refill(bucket, cfg.capacity, cfg.windowMs);
    if (bucket.tokens < 1) {
      // Time until the next token accrues.
      const deficit = 1 - bucket.tokens;
      const msPerToken = cfg.windowMs / cfg.capacity;
      const retryAfterSec = Math.max(1, Math.ceil((deficit * msPerToken) / 1000));
      return { ok: false, retryAfterSec, key };
    }

    bucket.tokens -= 1;
    bucket.activeStreams += 1;
    this.globalActive += 1;
    return { ok: true, retryAfterSec: 0, key };
  }

  /** Release a stream slot once the request completes (success or error). */
  release(key: string): void {
    if (!this.config.enabled) return;
    const bucket = this.buckets.get(key);
    if (bucket && bucket.activeStreams > 0) {
      bucket.activeStreams -= 1;
    }
    if (this.globalActive > 0) this.globalActive -= 1;
  }

  /** Snapshot of global active streams (observability/testing). */
  globalActiveStreams(): number {
    return this.globalActive;
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────
// Shared across all routes so the global concurrency ceiling is process-wide.

export const rateLimiter = new RateLimiter();

export const RATE_LIMIT_MESSAGE =
  'Intelligence unavailable — please try again shortly.';
