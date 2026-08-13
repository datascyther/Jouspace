// Sentiment whisper — a lightweight, local-first emotional signal scanner for
// the journal composer. Scans the user's writing for emotionally-loaded
// keywords, buckets them, and picks the single dominant sentiment so the
// composer can whisper a gentle, context-aware nudge. Purely heuristic (no
// model, no network) so it stays instant, private, and offline.

export type SentimentKey = 'heavy' | 'angry' | 'confused' | 'positive' | 'calm';

export interface SentimentResult {
  key: SentimentKey;
  /** The gentle, single-line nudge shown for this sentiment. */
  message: string;
  /** Number of distinct keywords matched (used to pick the dominant bucket). */
  score: number;
}

/** Emotionally-loaded keywords per sentiment bucket. */
export const SENTIMENT_KEYWORDS: Record<SentimentKey, string[]> = {
  heavy: [
    'anxious', 'anxiety', 'stress', 'stressed', 'overwhelm', 'overwhelmed',
    'heavy', 'sad', 'unhappy', 'tired', 'exhausted', 'afraid', 'scared',
    'worry', 'worried', 'panic', 'fear', 'burnout', 'burned', 'burden',
    'pressure', 'numb', 'hopeless', 'lonely', 'alone', 'lost', 'stuck',
    'tears', 'grief', 'guilt', 'ashamed', 'frozen', 'drained',
  ],
  angry: [
    'angry', 'anger', 'furious', 'mad', 'frustrated', 'frustration',
    'annoyed', 'irritated', 'resent', 'bitter', 'rage', 'hate', 'hateful',
    'fed up',
  ],
  confused: [
    'confused', 'confusion', 'unsure', 'uncertain', 'unclear', 'conflict',
    'conflicted', 'doubt', 'doubtful', 'tangled', 'confusing', 'perplexed',
    'baffled',
  ],
  positive: [
    'happy', 'glad', 'joy', 'joyful', 'excited', 'proud', 'accomplished',
    'grateful', 'thankful', 'hopeful', 'optimistic', 'great', 'wonderful',
    'love', 'loved', 'relieved', 'blessed', 'amazing', 'thrilled',
  ],
  calm: [
    'calm', 'peaceful', 'peace', 'steady', 'centered', 'grounded', 'serene',
    'at ease', 'tranquil', 'settled', 'clearheaded', 'reassured', 'relaxed',
    'mindful',
  ],
};

/** Ties resolve toward the emotionally-urgent end so a conflicted entry
 *  doesn't hide its heaviest feeling behind a gentler one. */
const SENTIMENT_PRIORITY: SentimentKey[] = [
  'heavy',
  'angry',
  'confused',
  'positive',
  'calm',
];

/** Gentle, single-line nudges shown for each sentiment. */
export const SENTIMENT_MESSAGES: Record<SentimentKey, string> = {
  heavy: 'This feels heavy — want to explore why?',
  angry: "There's some heat here. Want to unpack it?",
  confused: 'This feels tangled — want to sort it out?',
  positive: 'Something good is here — worth holding onto.',
  calm: "There's a quiet steadiness here.",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Count distinct, whole-word keyword matches for a bucket. */
function scoreBucket(text: string, keywords: string[]): number {
  let hits = 0;
  for (const keyword of keywords) {
    const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
    if (pattern.test(text)) hits += 1;
  }
  return hits;
}

/**
 * Detect the dominant emotional sentiment in a piece of writing. Returns the
 * highest-scoring sentiment (distinct whole-word keyword hits per bucket),
 * with ties resolved by `SENTIMENT_PRIORITY`, or `null` when no emotional
 * keywords are present.
 */
export function detectSentiment(text: string): SentimentResult | null {
  const normalized = text.toLowerCase();
  const scored = SENTIMENT_PRIORITY.map((key) => ({
    key,
    score: scoreBucket(normalized, SENTIMENT_KEYWORDS[key]),
  })).filter((entry) => entry.score > 0);

  if (scored.length === 0) return null;

  // Priority order already encodes tie-breaking: the first max-score entry
  // wins, so ties keep the higher-priority (more urgent) sentiment.
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a), scored[0]);

  return { key: best.key, message: SENTIMENT_MESSAGES[best.key], score: best.score };
}
