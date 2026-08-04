/**
 * Jouspace — AI Runtime: Intent Classifier
 *
 * Decides which capabilities a request needs. Primary path: a fast, cheap
 * Nemotron call returning structured JSON. Fallback: a deterministic keyword
 * heuristic so MEMORY/GENERAL requests stay low-latency even if the model
 * call fails. The classifier NEVER executes tools — it only classifies.
 */

import { Capability, type Intent, type ChatHistoryMessage, type MemoryContext } from './types';

interface ClassifyDeps {
  classifyViaModel: (text: string, history: ChatHistoryMessage[]) => Promise<Intent | null>;
}

const HEURISTICS: Array<{ test: RegExp; capability: Capability }> = [
  { test: /\b(weather|temperature|rain|sunny|air quality|aqi|wind|forecast|humid)\b/i, capability: Capability.WEATHER },
  { test: /\b(news|headline|today'?s ai|latest|happening|breaking|reuters|ap\b|published today)\b/i, capability: Capability.NEWS },
  { test: /\b(cbt|cognitive behavioral|meditation|pubmed|who|nih|nhs|cdc|clinical|diagnosis|symptom|medical)\b/i, capability: Capability.MEDICAL },
  { test: /\b(what is|who is|define|explain|history of|how does|wiki|science|fact)\b/i, capability: Capability.KNOWLEDGE },
];

/**
 * Recency + named-entity detection. If the user is asking about something
 * recent, newly released, or a specific named product/model/company/person,
 * they almost always want LIVE web results — not static knowledge. We force
 * NEWS (+ KNOWLEDGE for grounding) so the runtime always fetches fresh data.
 */
const RECENCY_PATTERN = /\b(latest|recent|new|newest|just|today|this week|this month|2025|2026|2027|currently|now|update|release|launched|unveiled|announced|breaking|trending)\b/i;
// Proper-noun / named-entity pattern: capitalized words, model names (K2/K3/GPT-4o/Claude 3), company+product.
const NAMED_ENTITY_PATTERN = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\b|\b(Kimi|GPT|Claude|Gemini|Llama|Nemotron|NVIDIA|OpenAI|Anthropic|Moonshot|DeepSeek|Qwen|Grok|Cohere|Mistral)\w*\b|\b\w+\s?(K\d+|v\d+(?:\.\d+)?)\b/i;

function wantsLiveWeb(text: string): boolean {
  return RECENCY_PATTERN.test(text) || NAMED_ENTITY_PATTERN.test(text);
}

function heuristicIntent(text: string): Intent {
  const caps = new Set<Capability>();
  for (const h of HEURISTICS) {
    if (h.test.test(text)) caps.add(h.capability);
  }
  // Emotional / personal sharing → memory only, NO live search. This takes
  // precedence over the recency heuristic so "I feel anxious today" stays
  // private and doesn't trigger a web fetch.
  const personal = /\b(i feel|i'm feeling|i am feeling|anxious|sad|happy|tired|lonely|stressed|overwhelmed|grateful)\b/i.test(text);
  if (personal) {
    caps.add(Capability.MEMORY);
  } else if (wantsLiveWeb(text)) {
    // Recency / named-entity → always fetch live web + knowledge grounding so
    // the answer reflects the latest facts, not the model's training cutoff.
    caps.add(Capability.NEWS);
    caps.add(Capability.KNOWLEDGE);
  }
  if (caps.size === 0) caps.add(Capability.GENERAL);

  return {
    capabilities: Array.from(caps),
    needsSearch: caps.has(Capability.NEWS) || caps.has(Capability.WEATHER) || caps.has(Capability.KNOWLEDGE) || caps.has(Capability.MEDICAL),
  };
}

export class IntentClassifier {
  constructor(private deps: ClassifyDeps) {}

  async classify(
    text: string,
    history: ChatHistoryMessage[],
    _ctx?: MemoryContext,
  ): Promise<Intent> {
    try {
      const modelIntent = await this.deps.classifyViaModel(text, history);
      if (modelIntent && modelIntent.capabilities.length > 0) {
        return modelIntent;
      }
    } catch {
      // fall through to heuristic
    }
    return heuristicIntent(text);
  }
}

/** Build the system+user messages for the model-based classifier. */
export function buildClassifierMessages(text: string): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `You are a routing classifier for an AI wellness companion. Given a user message, output ONLY JSON: {"capabilities":[...],"needsSearch":boolean}. Capabilities must be from: GENERAL, KNOWLEDGE, NEWS, WEATHER, MEDICAL, MEMORY, PROFILE, JOURNEY, RAG, EMERGENCY. Use MEMORY for emotional/personal sharing. Use WEATHER/NEWS/KNOWLEDGE/MEDICAL when live or factual info is needed. CRITICAL: if the message mentions something recent, newly released, trending, or a specific named product/model/company/person (e.g. "Kimi K3", "GPT-5", "latest AI model", "2026"), you MUST include both NEWS and KNOWLEDGE so the system fetches the latest web results.`,
    },
    { role: 'user', content: text },
  ];
}
