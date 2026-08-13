/**
 * aiSupport.ts — Shared helpers for the /api/ai/* routes.
 *
 * Wraps three cross-cutting concerns so each route stays focused on its pipeline:
 *  - Anonymous identity (X-User-Id header, normalized) for rate limiting.
 *  - Rate-limit acquisition / release (token bucket + concurrency ceiling).
 *  - Domain pre-filter refusal (streams a polite SSE without calling NVIDIA).
 *
 * The runtime stays stateless: identity is only used for anti-abuse accounting,
 * never persisted. The X-User-Id is client-supplied and spoofable — the global
 * concurrency ceiling is the real backstop.
 */

import type { Request, Response } from 'express';
import {
  rateLimiter,
  normalizeKey,
  type RateCapabilityKind,
} from './rateLimit.js';
import { GUARD_REFUSAL } from './guard.js';
import { initSSE } from './stream/StreamController.js';

/** Resolve the anonymous caller identity from the X-User-Id header (or IP). */
export function getUserId(req: Request): string {
  const raw =
    typeof req.headers['x-user-id'] === 'string'
      ? (req.headers['x-user-id'] as string)
      : undefined;
  return normalizeKey(raw, req.ip ?? 'unknown');
}

export interface RateCheck {
  ok: boolean;
  key: string;
  retryAfterSec: number;
}

/** Acquire a rate-limit slot for a request. Call AFTER Zod validation passes. */
export function acquireRateLimit(
  req: Request,
  kind: RateCapabilityKind
): RateCheck {
  const key = getUserId(req);
  const result = rateLimiter.acquire(key, kind);
  return { ok: result.ok, key: result.key, retryAfterSec: result.retryAfterSec };
}

/** Release a rate-limit slot once the request (stream) has finished. */
export function releaseRateLimit(key: string): void {
  rateLimiter.release(key);
}

/**
 * Stream a polite domain refusal as SSE without invoking the model — saves cost
 * when the cheap heuristic pre-filter flags clearly off-domain intent.
 */
export function streamRefusal(res: Response): void {
  initSSE(res);
  res.write(`data: ${JSON.stringify({ text: GUARD_REFUSAL })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}
