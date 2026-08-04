/**
 * Jouspace — AI Runtime: Bootstrap
 *
 * Dependency injection point. Registers capability → tool mappings into the
 * ToolRegistry. Adding Exa/Tavily/PubMed/WHO later is a register() call here,
 * not a change to the orchestrator or router.
 */

import { ToolRegistry } from './tools/Tool';
import { CacheManager } from './cache/CacheManager';
import { KnowledgeTool } from './tools/KnowledgeTool';
import { NewsTool } from './tools/NewsTool';
import { WeatherTool } from './tools/WeatherTool';
import { MedicalTool } from './tools/MedicalTool';
import { MemoryTool } from './tools/MemoryTool';
import { AIOrchestrator } from './AIOrchestrator';
import { Capability } from './types';
import { getFeatureFlags } from './config';
import { PineconeVectorStore } from './rag/vectorStore/PineconeVectorStore';
import { PineconeRetrievalTool } from './rag/PineconeRetrievalTool';
import { EmbeddingService } from './rag/ingestion/EmbeddingService';
import { SemanticCache } from './rag/SemanticCache';
import { Reranker } from './rag/Reranker';
import { QueryRewriter } from './rag/QueryRewriter';
import { MemoryService } from './memory/MemoryService';
import { PineconeMemoryStore } from './memory/PineconeMemoryStore';

export function createOrchestrator(): AIOrchestrator {
  const cache = new CacheManager();
  const registry = new ToolRegistry();
  const memory = new MemoryTool(cache);

  registry.register(new KnowledgeTool(cache));
  registry.register(new NewsTool(cache));
  registry.register(new WeatherTool(cache));
  registry.register(new MedicalTool(cache));
  registry.register(memory); // MEMORY
  registry.register(memory, Capability.PROFILE);
  registry.register(memory, Capability.JOURNEY);

  // Phase 4.1/5: RAG retrieval (Pinecone) + Phase 5 intelligence layers.
  // OFF by default (ENABLE_RAG=false) until ingestion + retrieval quality are
  // validated. When on, the retrieval tool is the only addition — the
  // orchestrator/router/ContextBuilder contracts are unchanged. The Phase 5
  // modules (semantic cache, reranker, query rewriter) are constructed here and
  // injected; each degrades gracefully when its dependencies are unconfigured.
  const flags = getFeatureFlags();
  let retrievalTool;
  if (flags.ENABLE_RAG) {
    const store = new PineconeVectorStore();
    const embeddings = new EmbeddingService();
    if (store.isConfigured() && embeddings.isConfigured()) {
      // Each module no-ops when its own config is absent, so construction is
      // always safe; they only activate under their respective feature flags.
      const semanticCache = flags.ENABLE_SEMANTIC_CACHE ? new SemanticCache(embeddings) : undefined;
      const reranker = flags.ENABLE_RERANK ? new Reranker() : undefined;
      const rewriter = flags.ENABLE_QUERY_REWRITE ? new QueryRewriter() : undefined;
      retrievalTool = new PineconeRetrievalTool(store, embeddings, {
        cache: semanticCache,
        reranker,
        rewriter,
        // Sprint 5.6 — retrieval analytics; the orchestrator reads
        // getLastAnalytics() and folds the metrics into the [ai-trace] line.
        analytics: flags.ENABLE_RETRIEVAL_ANALYTICS,
      });
    }
  }

  // Phase 6, Sprint 6.8 — durable memory. The PineconeMemoryStore mirrors the
  // in-memory cache to a per-uid Pinecone namespace so memories survive restarts.
  // It degrades to in-memory-only when Pinecone/embeddings are unconfigured, so
  // construction is always safe.
  const memoryService = new MemoryService({
    persistence: new PineconeMemoryStore(),
  });

  return new AIOrchestrator({ registry, cache, retrievalTool, memoryService });
}
