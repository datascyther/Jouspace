/**
 * guard.ts — Cheap journaling-domain pre-filter (anti-abuse + scope enforcement)
 *
 * Pure, testable, NO model call. A conservative heuristic that detects clearly
 * off-domain intent (coding, homework/math, news, medical/legal/financial advice,
 * general-assistant chores) and refuses it *before* calling NVIDIA — saving cost.
 *
 * Deliberately LENIENT: the system prompt is the real backstop for edge cases.
 * If in doubt, allow — a false positive on a user's private reflection is far
 * worse than letting a borderline request through to the (also-guarded) model.
 *
 * The detection looks for unambiguous off-domain *signals* (code blocks, code
 * keywords, homework framing, news/current-events framing, etc.). Reflective
 * language ("I feel", "my relationship", "I've been thinking") is never flagged.
 */

export type GuardVerdict = 'allow' | 'deny';

export const GUARD_REFUSAL =
  "I'm here for your journaling and reflection — I'm not built to act as a general assistant. " +
  'If something in your life is on your mind, I’d be glad to think it through with you.';

// ── Off-domain signal patterns ────────────────────────────────────────────────
// Each is scoped to reduce false positives on ordinary reflective writing.

const CODE_BLOCK = /```[\s\S]{0,4000}/; // fenced code block
const CODE_INLINE = /(`{1,2}[^`\n]{3,}`{1,2})/; // inline code span
const CODE_KEYWORDS =
  /\b(bug|compile|compiler|stack ?trace|segmentation fault|undefined is not|nullpointer|regex|sql query|api endpoint|http status|npm install|pip install|git (commit|push|merge|rebase)|docker|kubernetes|k8s|react hook|typescript|python script|function (that|which|to)|fibonacci|algorithm|for loop|async\/await|css|html|json parse)\b/i;
const HOMEWORK =
  /\b(homework|assignment|solve this (equation|problem)|what is the (answer|solution) to|show your work|due tomorrow|my professor|my teacher|textbook)\b/i;
const MATH_SOLVE =
  /\b(solve for x|integrate|derivative of|factorize|quadratic equation|calculate the (mean|median|standard deviation))\b/i;
const NEWS_EVENTS =
  /\b(latest news|breaking news|current events|today'?s news|(the )?news (today|headlines|this week)|stock (market|price|news)|market news|what'?s (in the news|happening in the world)|election results|who won|scores? (today|last night)|celebrity (news|gossip)|headline)\b/i;
const MEDICAL_ADVICE =
  /\b(diagnose|what (medication|drug|pills?) should|prescribe|is this (cancer|tumor|disease)|symptoms of|should i see a doctor|dosage)\b/i;
const LEGAL_ADVICE =
  /\b(sue|lawsuit|file a (complaint|claim)|legal advice|my contract says|tenant rights|divorce papers|immigration)\b/i;
const FINANCIAL_ADVICE =
  /\b(should i (invest|buy|sell) (stocks?|crypto|bitcoin)|tax return|portfolio|mortgage rate|interest rate)\b/i;
const GENERAL_CHORES =
  /\b(write (?:a |an |me a |me an |my )?(resume|cover letter|email|letter)(?: to| for)?|draft (?:a |an |me a )?(email|letter|message)(?: to| for)?|translate (this|the (following|text|paragraph))|summariz?e this (article|text|pdf|page)|set a (reminder|timer)|book (?:a |me a )?(table|flight|appointment)|make a (table|spreadsheet|list of)|create a (table|spreadsheet|todo list))\b/i;

// A request is off-domain only when it carries a strong, unambiguous signal.
const OFF_DOMAIN_PATTERNS: RegExp[] = [
  CODE_BLOCK,
  CODE_INLINE,
  CODE_KEYWORDS,
  HOMEWORK,
  MATH_SOLVE,
  NEWS_EVENTS,
  MEDICAL_ADVICE,
  LEGAL_ADVICE,
  FINANCIAL_ADVICE,
  GENERAL_CHORES,
];

/**
 * Classify a single piece of user text as on-domain (allow) or off-domain
 * (deny). Text is treated as opaque; only structural/lexical signals matter.
 * Empty or whitespace-only input is allowed (the route validates non-emptiness).
 */
export function classifyIntent(text: string): GuardVerdict {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 'allow';

  // Long reflective passages are overwhelmingly on-domain; don't scan the whole
  // thing for a stray keyword. Cap the scanned window to the first ~600 chars,
  // which is where off-domain commands ("write me an email that...") live.
  const window = trimmed.slice(0, 600);

  for (const pattern of OFF_DOMAIN_PATTERNS) {
    if (pattern.test(window)) return 'deny';
  }
  return 'allow';
}

/**
 * Convenience: refuse if ANY provided text segment is off-domain. Used by routes
 * that may pass the latest user message, an insight anchor, or user thought.
 */
export function anyOffDomain(...texts: (string | undefined)[]): boolean {
  return texts.some((t) => t != null && classifyIntent(t) === 'deny');
}
