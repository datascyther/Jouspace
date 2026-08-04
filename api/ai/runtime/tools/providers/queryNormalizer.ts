/**
 * Jouspace — AI Runtime: Query Normalization
 *
 * Shared, pure helpers that turn a raw user utterance into a retrievable topic
 * phrase. Used by knowledge/news tools so free providers (Wikipedia, Google
 * News) get a clean title/search term instead of the literal question
 * ("What is CBT?" → "CBT"). No I/O, no side effects — safe to unit test.
 */

const QUESTION_PREFIXES = [
  /^what(?:'s| is| are| was| were)?\s+/i,
  /^who(?:'s| is| are| was| were)?\s+/i,
  /^where(?:'s| is| are)?\s+/i,
  /^when(?:'s| is| are| was| were)?\s+/i,
  /^why(?:'s| is| are)?\s+/i,
  /^how(?:'s| is| are| do| does| can| to)?\s+/i,
  /^can you (?:tell me about|explain|define|describe)\s+/i,
  /^tell me about\s+/i,
  /^explain\s+/i,
  /^define\s+/i,
  /^describe\s+/i,
  /^give me\s+(?:info(?:rmation)? on|details about)\s+/i,
];

const FILLER = /\b(please|the|a|an|me|about|is|are|was|were|do|does|can|you|your|my|some|more|information on|info on)\b/gi;

/**
 * Strip question framing and filler so a provider receives a topic phrase.
 * Examples:
 *   "What is CBT?"            → "CBT"
 *   "Explain cognitive behavioral therapy" → "cognitive behavioral therapy"
 *   "latest AI news"          → "latest AI news" (unchanged — already a topic)
 */
export function normalizeQuery(raw: string): string {
  let q = (raw ?? '').trim();
  if (!q) return '';

  for (const re of QUESTION_PREFIXES) {
    const next = q.replace(re, '');
    if (next !== q) {
      q = next;
      break;
    }
  }

  q = q.replace(FILLER, ' ');
  q = q.replace(/\s{2,}/g, ' ').trim();
  // Drop trailing punctuation that breaks title lookups.
  q = q.replace(/[?.!,]+$/g, '').trim();
  return q || raw.trim();
}
