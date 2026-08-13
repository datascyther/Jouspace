/**
 * reasoning.ts — Adaptive reasoning profile derivation
 *
 * Picks how much chain-of-thought the model should spend per request, based
 * purely on the size of the input (latest user text + journal context). The
 * gateway maps a ReasoningProfile to concrete provider params.
 *
 * Profiles are intentionally isolated as a small ordered enum so routes can
 * floor non-chat capabilities at 'balanced' (precise) and the gateway owns the
 * provider-specific numbers.
 */

export type ReasoningProfile = 'fast' | 'balanced' | 'deep';

export interface ReasoningInput {
  /** The latest user message (chat) or follow-up thought (reflect). */
  userText?: string;
  /** Client-sent journal entries used for AI context. */
  entries?: { title: string; content: string }[];
  /** Sum of the other (non-latest) message characters, for chat history. */
  contextChars?: number;
}

/** Heuristic thresholds — isolated as constants so they can be tuned in one place. */
export const THRESHOLDS = {
  deepUserChars: 900,
  deepEntryCount: 12,
  deepSubstantiveUserChars: 120,
  deepTotalChars: 3500,
  fastUserChars: 60,
  fastContextChars: 20000,
} as const;

const ORDER: Record<ReasoningProfile, number> = {
  fast: 0,
  balanced: 1,
  deep: 2,
};

/**
 * Raise a profile to at least `min`. Used to forbid the 'fast' tier on
 * substantive generations (reflect/insight/summarize) so they never lose
 * precision for the sake of speed.
 */
export function floorProfile(p: ReasoningProfile, min: ReasoningProfile): ReasoningProfile {
  return ORDER[p] < ORDER[min] ? min : p;
}

/**
 * Derive the reasoning profile from input size.
 *
 * - 'deep'    for large inputs (long user text, corpus-only requests over a
 *             large journal, or long + substantive chat history).
 * - 'fast'    for trivial inputs only (short latest message, modest chat
 *             history). This is the "instant" path — short questions included.
 * - 'balanced' the default otherwise.
 *
 * `userText` is guarded with `?? ''` because insight/summarize pass no user
 * text.
 */
export function deriveReasoningProfile(input: ReasoningInput): ReasoningProfile {
  const userText = input.userText ?? '';
  const entries = input.entries ?? [];
  const contextChars = input.contextChars ?? 0;

  const uChars = userText.length;
  const eCount = entries.length;
  const eChars = entries.reduce(
    (sum, e) => sum + (e.title?.length ?? 0) + (e.content?.length ?? 0),
    0
  );
  const total = uChars + eChars + contextChars;

  if (uChars >= THRESHOLDS.deepUserChars) {
    return 'deep';
  }

  // Corpus-only capabilities (insight/summarize, uChars === 0) keep the
  // entry-count-driven deep trigger on big corpora — no regression.
  if (uChars === 0 && eCount >= THRESHOLDS.deepEntryCount) {
    return 'deep';
  }

  if (
    uChars >= THRESHOLDS.deepSubstantiveUserChars &&
    total >= THRESHOLDS.deepTotalChars
  ) {
    return 'deep';
  }

  if (
    uChars > 0 &&
    uChars <= THRESHOLDS.fastUserChars &&
    contextChars <= THRESHOLDS.fastContextChars
  ) {
    return 'fast';
  }

  return 'balanced';
}
