/**
 * Jouspace — AI Runtime: Core Types
 *
 * Shared contracts for the server-side AI orchestration layer.
 * The edge function (api/ai/chat.ts) is a thin entrypoint that delegates
 * to AIOrchestrator. All business logic lives in api/ai/runtime.
 *
 * Wire contract note: the streamed response uses the SAME shape the client
 * already expects — { id, contentDelta, done? }. A terminal chunk carries
 * `citations` so the UI can render sources without parsing prose.
 */

export type Role = 'user' | 'assistant' | 'system';

export type ChatMode = 'concise' | 'standard' | 'deep';
export type ResponseMode = ChatMode;

/** Capabilities the orchestrator can ask for. The router maps these to tools. */
export enum Capability {
  GENERAL = 'GENERAL',
  KNOWLEDGE = 'KNOWLEDGE',
  NEWS = 'NEWS',
  WEATHER = 'WEATHER',
  MEDICAL = 'MEDICAL',
  MEMORY = 'MEMORY',
  PROFILE = 'PROFILE',
  JOURNEY = 'JOURNEY',
  RAG = 'RAG',
  EMERGENCY = 'EMERGENCY',
}

/** User-state context forwarded from the client (mirrors src/services/memory/types AIContext). */
export interface MemoryContext {
  userName?: string;
  preferredTone?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  returningUser?: boolean;
  previousMood?: string;
  summary?: string;
  goals?: string[];
  reflectionStreak?: number;
  currentJourney?: string;
  preferences?: string[];
  recentTopics?: string[];
  sessionCount?: number;
}

export interface ChatHistoryMessage {
  role: Exclude<Role, 'system'>;
  content: string;
}

export interface AIRequest {
  text: string;
  conversationId?: string;
  sessionId?: string;
  uid: string;
  history?: ChatHistoryMessage[];
  mode?: ChatMode;
  /** Server-determined response mode based on query analysis. Overrides mode when set. */
  responseMode?: ResponseMode;
  memoryContext?: MemoryContext;
  /** Optional client-supplied correlation id; when absent the orchestrator generates one. */
  requestId?: string;
}

/** A single sourced citation attached to retrieved content. */
export interface Citation {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  snippet?: string;
  confidence: number;
}

/**
 * Standardized tool output envelope. Every capability returns this exact
 * shape so the orchestrator and ContextBuilder stay provider-agnostic.
 */
export interface ToolResult {
  capability: Capability;
  success: boolean;
  confidence: number;
  timestamp: string;
  sources: Citation[];
  payload: string;
  error?: string;
}

/** Structured intent produced by IntentClassifier. */
export interface Intent {
  capabilities: Capability[];
  needsSearch: boolean;
  raw?: unknown;
}

/** Streaming chunk emitted to the client (unchanged wire contract). */
export interface StreamChunk {
  id: string;
  contentDelta: string;
  done?: boolean;
  /** Present on a terminal error chunk (graceful degradation, not a crash). */
  error?: string;
  /** Present on the terminal chunk when the model response appears cut off mid-sentence. */
  truncated?: boolean;
  citations?: Citation[];
  /** Present on the first chunk only, as a non-content correlation field. */
  requestId?: string;
  /** Present on the first chunk only: classifier-chosen capabilities. */
  capabilities?: Capability[];
  /** Present on the first chunk only: capability tools that actually ran. */
  toolsUsed?: Capability[];
  /** Present on the first chunk only: server-determined response mode. */
  responseMode?: ResponseMode;
}

/** Minimal gateway contract the orchestrator depends on (DI-friendly). */
export interface ModelGatewayLike {
  streamCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    mode?: ChatMode,
    responseMode?: ResponseMode,
  ): AsyncGenerator<StreamChunk>;
}

/** Feature flags — gate capabilities independently without code changes. */
export interface FeatureFlags {
  ENABLE_KNOWLEDGE: boolean;
  ENABLE_NEWS: boolean;
  ENABLE_WEATHER: boolean;
  ENABLE_MEDICAL: boolean;
  ENABLE_MEMORY: boolean;
  ENABLE_CITATIONS: boolean;
  ENABLE_RAG: boolean;
  ENABLE_SEMANTIC_CACHE: boolean;
  ENABLE_RERANK: boolean;
  ENABLE_QUERY_REWRITE: boolean;
  ENABLE_RETRIEVAL_ANALYTICS: boolean;
  /** Sprint 5.7 — internal quality scoring (defaults on; no-op when RAG disabled). */
  ENABLE_QUALITY_SCORING: boolean;
  /** Sprint 5.8 — evaluation suite runner (defaults on; no-op without retrieval). */
  ENABLE_EVALUATION: boolean;
  /** Phase 6 — Memory Extraction Engine (defaults on; pure, no LLM call). */
  ENABLE_MEMORY_EXTRACTION: boolean;
}

/**
 * Sprint 5.6 — retrieval analytics fields optionally attached to a request
 * trace. Mirrors {@link RetrievalAnalyticsSnapshot} in
 * api/ai/runtime/rag/RetrievalAnalytics.ts (kept as a plain shape here to avoid
 * a types → rag import cycle). All optional; present only when a retrieval tool
 * exposes analytics and ENABLE_RETRIEVAL_ANALYTICS is on.
 */
export interface RetrievalAnalyticsFields {
  retrieval_latency: number;
  retrieval_hits: number;
  retrieval_misses: number;
  cache_hits: number;
  cache_misses: number;
  rerank_time: number;
  empty_results: number;
  average_similarity: number;
  top_document: string;
  knowledge_category: string;
}

/**
 * Sprint 5.7 — quality fields attached to a request trace. Plain shape here to
 * avoid a types → rag import cycle. Present only when ENABLE_QUALITY_SCORING
 * is on and the scorer completes without throwing.
 */
export interface QualityFields {
  memoryQuality: number;
  ragQuality: number;
  liveSearchQuality: number;
  citationCount: number;
  retrievalConfidence: number;
  responseConfidence: number;
  overall: number;
}

/** Observability trace emitted per request. */
export interface RequestTrace {
  requestId: string;
  intentMs: number;
  capabilities: Capability[];
  toolsUsed: Capability[];
  cacheHits: Capability[];
  cacheMisses: Capability[];
  providerMs: number;
  llmMs: number;
  totalMs: number;
  /** Sprint 5.6 — RAG retrieval analytics snapshot (optional). */
  retrieval?: RetrievalAnalyticsFields;
  /** Sprint 5.7 — internal quality score (optional, not surfaced to users). */
  quality?: QualityFields;
}

/**
 * Phase 6 — Personal Intelligence Layer.
 *
 * Structured, purpose-separated memory. Each memory belongs to one of four
 * stores (see MemoryStore.ts) so retrieval/personalization can target the
 * right kind of knowledge without one giant blob. Plain shapes live here to
 * avoid a types → memory import cycle.
 */
export type MemoryType =
  | 'profile'
  | 'episodic'
  | 'semantic'
  | 'reflection';

export interface ExtractedMemory {
  type: MemoryType;
  /** Sub-category, e.g. 'sleep', 'anxiety', 'goal', 'preference'. */
  topic: string;
  /** Human-readable detail (what was learned). */
  detail: string;
  /** Model/extractor confidence 0..1. */
  confidence: number;
  /** ISO timestamp when extracted. */
  extractedAt: string;
}

export interface StoredMemory {
  uid: string;
  memories: ExtractedMemory[];
  context: MemoryContext;
  updatedAt: string;
}
