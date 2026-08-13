/**
 * schemas.ts — Shared Zod request schemas for /api/ai/* routes.
 *
 * Centralizes the on-wire contract so every capability validates identically:
 *  - Entry content is now capped (it was previously unbounded, which could blow
 *    the model token budget or the express.json body limit). Matches the 8000-char
 *    message cap used elsewhere.
 *  - Optional `profile` carries device-derived personalization (treated as DATA).
 */

import { z } from 'zod';

export const EntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string().max(200),
  theme: z.string().max(80),
  content: z.string().max(8000),
});

/**
 * A client-sent conversation message. The `system` role is deliberately
 * excluded — the runtime owns the system prompt; a client must never inject one.
 * Zod rejects any message whose `role` is `system` (or missing/invalid).
 */
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
});

/**
 * Device-derived personalization profile. `personalization` is capped — it is
 * injected into the system prompt as data, never as instructions, so its size
 * is bounded for both cost and prompt-injection surface reasons.
 */
export const ProfileSchema = z.object({
  userName: z.string().min(1).max(80).optional(),
  topThemes: z.array(z.string().max(80)).max(20).optional(),
  personalization: z.string().max(2000).optional(),
});

export const CLIENT_PROFILE_KEY = 'profile' as const;
