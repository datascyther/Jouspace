/**
 * Jouspace — AI Runtime: Pinecone-backed Retrieval Tool (Phase 4.1)
 *
 * Implements the RetrievalTool contract using a VectorStore (Pinecone) plus an
 * EmbeddingService (NVIDIA). The rest of the runtime only knows
 * `RetrievalTool.retrieve(query): Promise<ContextChunk[]>` — it never sees
 * Pinecone. Swapping vector backends later means writing a new VectorStore.
 *
 * Returns [] when RAG is unconfigured (no key / flag off) so the orchestrator
 * stays stable and ContextBuilder simply omits the INTERNAL KNOWLEDGE block.
 *
 * The query logic (TopK, score threshold, dedupe) is delegated to Retriever so
 * it is independently testable; this class is the thin contract adapter.
 */

import { Capability } from '../types';
import type { ContextChunk, RetrievalTool } from './RetrievalTool';
import type { VectorStore } from './vectorStore/VectorStore';
import { EmbeddingService } from './ingestion/EmbeddingService';
import { Retriever, type RetrieverDeps } from './Retriever';
import type { SemanticCache } from './SemanticCache';
import type { RerankerLike } from './Reranker';
import type { QueryRewriter } from './QueryRewriter';
import type { RetrievalAnalyticsSnapshot } from './RetrievalAnalytics';

export interface PineconeRetrievalToolOptions {
  topK?: number;
  minScore?: number;
  /** Phase 5: optional semantic cache (5.1). */
  cache?: SemanticCache;
  /** Phase 5: optional reranker (5.2). */
  reranker?: RerankerLike;
  /** Phase 5: optional query rewriter (5.4). */
  rewriter?: QueryRewriter;
  /** Sprint 5.6: enable per-request retrieval analytics (getLastAnalytics). */
  analytics?: boolean;
}

export class PineconeRetrievalTool implements RetrievalTool {
  readonly capability = Capability.RAG;
  readonly name = 'PineconeRetrievalTool';

  private retriever: Retriever;

  constructor(
    store: VectorStore,
    embeddings: EmbeddingService,
    opts: PineconeRetrievalToolOptions = {},
  ) {
    const deps: RetrieverDeps = {
      cache: opts.cache,
      reranker: opts.reranker,
      rewriter: opts.rewriter,
      analytics: opts.analytics,
    };
    this.retriever = new Retriever(
      store,
      embeddings,
      opts.topK ?? 5,
      opts.minScore ?? 0.3,
      deps,
    );
  }

  isConfigured(): boolean {
    return this.retriever.isConfigured();
  }

  async retrieve(query: string): Promise<ContextChunk[]> {
    return this.retriever.retrieve(query);
  }

  /**
   * Sprint 5.6 — analytics snapshot from the most recent retrieve(). The
   * RetrievalTool contract signature is unchanged; the orchestrator
   * feature-detects this optional method and folds the metrics into the trace.
   */
  getLastAnalytics(): RetrievalAnalyticsSnapshot | null {
    return this.retriever.getLastAnalytics();
  }
}
