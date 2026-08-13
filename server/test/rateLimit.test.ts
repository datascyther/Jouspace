import { describe, it, expect } from 'vitest';
import { RateLimiter, normalizeKey } from '../rateLimit.js';
import type { RateLimitConfig } from '../rateLimit.js';

function config(over: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return {
    conversationalTokens: 3,
    conversationalWindowMs: 600_000,
    generativeTokens: 10,
    generativeWindowMs: 600_000,
    perUserConcurrency: 10,
    globalConcurrency: 10,
    enabled: true,
    ...over,
  };
}

describe('rateLimit.normalizeKey', () => {
  it('strips control chars and truncates long keys', () => {
    expect(normalizeKey('ab\ncd', 'fallback')).toBe('abcd');
    expect(normalizeKey('x'.repeat(200), 'f').length).toBe(128);
    expect(normalizeKey(undefined, 'fallback')).toBe('fallback');
  });
});

describe('rateLimit token bucket', () => {
  it('rejects after N requests when disabled=false enforced', () => {
    const lim = new RateLimiter(config(), () => 1_000_000);
    // capacity 3, same key, big window → first 3 ok, 4th denied.
    expect(lim.acquire('u1', 'conversational').ok).toBe(true);
    expect(lim.acquire('u1', 'conversational').ok).toBe(true);
    expect(lim.acquire('u1', 'conversational').ok).toBe(true);
    const fourth = lim.acquire('u1', 'conversational');
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it('is a no-op when disabled', () => {
    const lim = new RateLimiter(config({ enabled: false }));
    for (let i = 0; i < 50; i++) {
      expect(lim.acquire('u' + i, 'conversational').ok).toBe(true);
    }
  });
});

describe('rateLimit global concurrency ceiling', () => {
  it('caps total simultaneous streams across users', () => {
    const lim = new RateLimiter(
      config({ perUserConcurrency: 10, globalConcurrency: 2, conversationalTokens: 100 })
    );
    expect(lim.acquire('a', 'conversational').ok).toBe(true);
    expect(lim.acquire('b', 'conversational').ok).toBe(true);
    // Third concurrent stream (any key) must be rejected by the global ceiling.
    const third = lim.acquire('c', 'conversational');
    expect(third.ok).toBe(false);
    expect(lim.globalActiveStreams()).toBe(2);
    // Releasing one frees a slot.
    lim.release('a');
    expect(lim.acquire('c', 'conversational').ok).toBe(true);
  });
});

describe('rateLimit per-user concurrency', () => {
  it('caps streams per single user', () => {
    const lim = new RateLimiter(
      config({ perUserConcurrency: 2, globalConcurrency: 10, conversationalTokens: 100 })
    );
    expect(lim.acquire('u', 'conversational').ok).toBe(true);
    expect(lim.acquire('u', 'conversational').ok).toBe(true);
    expect(lim.acquire('u', 'conversational').ok).toBe(false);
  });
});
