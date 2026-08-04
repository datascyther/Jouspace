/**
 * Jouspace — AI Runtime: Feature Flags & Observability
 *
 * Lightweight, dependency-free. Flags are read from environment at request
 * time so capabilities can be toggled without redeploys. Observability is
 * console-based for now and structured so it can be swapped for a real sink.
 */

import type { FeatureFlags, RequestTrace } from './types';

function flag(name: string, fallback = true): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1';
}

export function getFeatureFlags(): FeatureFlags {
  const ENABLE_RAG = flag('ENABLE_RAG', false);
  return {
    ENABLE_KNOWLEDGE: flag('ENABLE_KNOWLEDGE'),
    ENABLE_NEWS: flag('ENABLE_NEWS'),
    ENABLE_WEATHER: flag('ENABLE_WEATHER'),
    ENABLE_MEDICAL: flag('ENABLE_MEDICAL'),
    ENABLE_MEMORY: flag('ENABLE_MEMORY'),
    ENABLE_CITATIONS: flag('ENABLE_CITATIONS'),
    ENABLE_RAG,
    // Phase 5 — Intelligence Optimization. Defaults: cache + rewrite ON when
    // RAG is on (they only help when retrieval is configured); rerank ON. They
    // individually no-op when embeddings/store are unconfigured.
    ENABLE_SEMANTIC_CACHE: flag('ENABLE_SEMANTIC_CACHE', ENABLE_RAG),
    ENABLE_RERANK: flag('ENABLE_RERANK', true),
    ENABLE_QUERY_REWRITE: flag('ENABLE_QUERY_REWRITE', ENABLE_RAG),
    // Sprint 5.6 — retrieval analytics. Default ON; it only records when a
    // retrieval tool exposes analytics, and never affects the response path.
    ENABLE_RETRIEVAL_ANALYTICS: flag('ENABLE_RETRIEVAL_ANALYTICS', true),
    // Sprint 5.7 — internal quality scoring. Default ON; never surfaces to
    // users. The scorer is pure and defensive so it cannot break the response.
    ENABLE_QUALITY_SCORING: flag('ENABLE_QUALITY_SCORING', true),
    // Sprint 5.8 — evaluation suite runner. Default ON; only used by tests /
    // external harnesses, not the request path.
    ENABLE_EVALUATION: flag('ENABLE_EVALUATION', true),
    // Phase 6 — Personal Intelligence Layer. Extraction enriches context in
    // memory from conversation; default ON, pure + free (no LLM call).
    ENABLE_MEMORY_EXTRACTION: flag('ENABLE_MEMORY_EXTRACTION', true),
  };
}

export function isCapabilityEnabled(cap: string, flags: FeatureFlags): boolean {
  switch (cap) {
    case 'KNOWLEDGE':
      return flags.ENABLE_KNOWLEDGE;
    case 'NEWS':
      return flags.ENABLE_NEWS;
    case 'WEATHER':
      return flags.ENABLE_WEATHER;
    case 'MEDICAL':
      return flags.ENABLE_MEDICAL;
    case 'MEMORY':
    case 'PROFILE':
    case 'JOURNEY':
      return flags.ENABLE_MEMORY;
    case 'RAG':
      return flags.ENABLE_RAG;
    default:
      return true;
  }
}

/** Minimal stopwatch for request traces. */
export class Timer {
  private start = Date.now();
  stop(): number {
    return Date.now() - this.start;
  }
}

/**
 * Emit a structured request trace. Console-only today; the shape is stable
 * so it can be forwarded to a real telemetry sink later without call-site
 * changes.
 */
export function logTrace(trace: RequestTrace): void {
  const base = `[ai-trace] ${trace.requestId} intent=${trace.intentMs}ms provider=${trace.providerMs}ms llm=${trace.llmMs}ms total=${trace.totalMs}ms capabilities=${trace.capabilities.join(',')} tools=${trace.toolsUsed.join(',')} cacheHit=${trace.cacheHits.join(',')} cacheMiss=${trace.cacheMisses.join(',')}`;
  const r = trace.retrieval;
  const retrieval = r
    ? ` retrievalLatency=${r.retrieval_latency}ms retrievalHits=${r.retrieval_hits} retrievalMisses=${r.retrieval_misses} ragCacheHits=${r.cache_hits} ragCacheMisses=${r.cache_misses} rerankTime=${r.rerank_time}ms emptyResults=${r.empty_results} avgSimilarity=${r.average_similarity.toFixed(3)} topDoc=${r.top_document || '-'} knowledgeCategory=${r.knowledge_category || '-'}`
    : '';
  // eslint-disable-next-line no-console
  console.log(base + retrieval);
}
