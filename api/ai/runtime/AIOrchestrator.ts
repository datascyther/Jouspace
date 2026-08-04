/**
 * Jouspace — AI Runtime: Orchestrator (single execution entry point)
 *
 * Every AI request flows through here:
 *   request → IntentClassifier → ToolRouter → ContextBuilder → ModelGateway → stream
 *
 * Responsibilities:
 *  - classify intent (Nemotron-driven, heuristic fallback)
 *  - run selected capability tools (parallel, cache-aware)
 *  - assemble unified context + citations
 *  - stream Nemotron's response (unchanged {id, contentDelta, done} wire shape)
 *  - emit a terminal chunk carrying deduplicated citations
 *  - emit an observability trace
 *
 * No business logic lives outside this layer (or its injected collaborators).
 */

import {
  Capability,
  type AIRequest,
  type StreamChunk,
  type Intent,
  type RequestTrace,
  type ChatHistoryMessage,
  type MemoryContext,
  type ModelGatewayLike,
  type RetrievalAnalyticsFields,
  type ResponseMode,
} from './types';
import { ModelGateway } from './ModelGateway';
import { buildSystemPrompt } from './PromptAssembler';
import { IntentClassifier, buildClassifierMessages } from './IntentClassifier';
import { ToolRouter } from './ToolRouter';
import { ToolRegistry } from './tools/Tool';
import { ContextBuilder } from './ContextBuilder';
import { CacheManager } from './cache/CacheManager';
import { getFeatureFlags, Timer, logTrace } from './config';
import type { RetrievalTool } from './rag/RetrievalTool';
import { QualityScorer } from './rag/QualityScorer';
import type { QualityFields } from './types';
import { MemoryExtractor } from './memory/MemoryExtractor';
import { MemoryStore } from './memory/MemoryStore';
import { MemoryService } from './memory/MemoryService';
import { routeResponse } from './ResponseRouter';

export interface OrchestratorDeps {
  registry: ToolRegistry;
  cache?: CacheManager;
  gateway?: ModelGatewayLike;
  /** Optional RAG retriever (Phase 4.1). Wired only when ENABLE_RAG is on. */
  retrievalTool?: RetrievalTool;
  /** Phase 6 — Personal Intelligence Layer (defaults constructed internally). */
  memoryExtractor?: MemoryExtractor;
  memoryStore?: MemoryStore;
  /** Preferred entry point: the runtime talks to the service, not storage. */
  memoryService?: MemoryService;
}

export class AIOrchestrator {
  private gateway: ModelGatewayLike;
  private cache: CacheManager;
  private classifier: IntentClassifier;
  private router: ToolRouter;
  private contextBuilder: ContextBuilder;
  private retrievalTool?: RetrievalTool;
  private memoryService: MemoryService;

  constructor(deps: OrchestratorDeps) {
    this.gateway = deps.gateway ?? new ModelGateway();
    this.cache = deps.cache ?? new CacheManager();
    this.contextBuilder = new ContextBuilder();
    this.retrievalTool = deps.retrievalTool;
    this.memoryService =
      deps.memoryService ??
      new MemoryService(
        { extractor: deps.memoryExtractor, store: deps.memoryStore },
        { enabled: getFeatureFlags().ENABLE_MEMORY_EXTRACTION },
      );
    const flags = getFeatureFlags();
    this.router = new ToolRouter(deps.registry, flags);
    this.classifier = new IntentClassifier({
      classifyViaModel: (text, history) => this.classifyViaModel(text, history),
    });
  }

  /** Cheap, non-streaming classification call to Nemotron. */
  private async classifyViaModel(
    text: string,
    history: ChatHistoryMessage[],
  ): Promise<Intent | null> {
    try {
      const messages = buildClassifierMessages(text);
      // Reuse gateway streaming but accumulate a short JSON response.
      let json = '';
      for await (const chunk of this.gateway.streamCompletion(messages, 'standard')) {
        json += chunk.contentDelta;
        if (json.length > 600) break;
      }
      const parsed = JSON.parse(json.replace(/^[\s\S]*?\{/, '{').replace(/\}[^}]*$/, '}'));
      const caps: Capability[] = Array.isArray(parsed.capabilities)
        ? parsed.capabilities.filter((c: string) => Object.values(Capability).includes(c as Capability))
        : [];
      if (caps.length === 0) return null;
      return {
        capabilities: caps,
        needsSearch: Boolean(parsed.needsSearch),
        raw: parsed,
      };
    } catch {
      return null;
    }
  }

  async *handle(req: AIRequest): AsyncGenerator<StreamChunk> {
    const requestId = req.requestId && typeof req.requestId === 'string' && req.requestId.trim().length > 0
      ? req.requestId.trim()
      : crypto.randomUUID();
    const flags = getFeatureFlags();
    const intentTimer = new Timer();
    const totalTimer = new Timer();

    // Determine response mode from query text (concise / standard / deep).
    // The server-side router runs before any LLM call — no extra latency.
    const responseMode: ResponseMode = routeResponse(req.text);

    // Phase 6 — Personal Intelligence. Enrich the user's context from this turn
    // through the MemoryService (extraction, scoring, storage, ranking, and
    // privacy controls all live behind that one surface). The service degrades
    // gracefully to the client-supplied context when the feature is off or the
    // user has opted out.
    const remembered = this.memoryService.remember(
      req.uid,
      req.text,
      req.memoryContext,
      req.history ?? [],
    );
    let enrichedContext: MemoryContext = remembered.context;

    const intent = await this.classifier.classify(req.text, req.history ?? [], enrichedContext);
    const intentMs = intentTimer.stop();

    // Run tools (parallel). Cache hits/misses recorded inside CacheManager.
    const providerTimer = new Timer();
    const results = await this.router.run(
      intent,
      {
        query: req.text,
        memoryContext: enrichedContext,
        uid: req.uid,
        location: (enrichedContext as MemoryContext & { location?: { lat: number; lon: number } })?.location,
      },
    );
    const providerMs = providerTimer.stop();

    // Phase 4.1: optional internal-knowledge retrieval (RAG). Only runs when
    // ENABLE_RAG is on and a retrieval tool is wired; degrades to [] otherwise.
    const ragChunks = flags.ENABLE_RAG && this.retrievalTool
      ? await this.retrievalTool.retrieve(req.text).catch(() => [])
      : [];

    // Sprint 5.6: fold retrieval analytics into the trace when the tool exposes
    // them (feature-detected; RetrievalTool contract signature is unchanged).
    // Never let instrumentation break the response path.
    let retrievalAnalytics: RetrievalAnalyticsFields | undefined;
    if (flags.ENABLE_RAG && flags.ENABLE_RETRIEVAL_ANALYTICS && this.retrievalTool) {
      try {
        const tool = this.retrievalTool as RetrievalTool & {
          getLastAnalytics?: () => RetrievalAnalyticsFields | null;
        };
        if (typeof tool.getLastAnalytics === 'function') {
          retrievalAnalytics = tool.getLastAnalytics() ?? undefined;
        }
      } catch {
        retrievalAnalytics = undefined;
      }
    }

    // Sprint 6.5 — Memory Retrieval (via the service). Surface only the most
    // relevant personal memories (ranked by importance × query similarity) into
    // the prompt, not the whole history. Returns '' when disabled/opted-out.
    const personalMemories = this.memoryService.recall(req.uid, req.text, 5);

    const citations = flags.ENABLE_CITATIONS
      ? this.contextBuilder.citations(results)
      : [];
    const contextBlock = this.contextBuilder.buildContextBlock(results, ragChunks);

    const system = buildSystemPrompt(enrichedContext, responseMode);
    let augmentedSystem = contextBlock ? `${system}\n\n${contextBlock}` : system;
    if (personalMemories) {
      augmentedSystem += `\n\n## Personal Memory (relevant to this message)\n${personalMemories}`;
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: augmentedSystem },
      ...(req.history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: req.text },
    ];

    const llmTimer = new Timer();
    let firstChunk = true;
    let responseText = '';
    const toolsUsed = results.map((r) => r.capability);
    for await (const chunk of this.gateway.streamCompletion(messages, req.mode ?? 'standard', responseMode)) {
      responseText += chunk.contentDelta;
      if (firstChunk) {
        firstChunk = false;
        llmTimer.stop(); // measured from first token
        // Echo correlation + observability fields on the first streamed chunk
        // so a client can deterministically map its request to the server's
        // [ai-trace] and to the provider-selection decision (plan §1.2/§1.6).
        yield {
          ...chunk,
          requestId,
          responseMode,
          capabilities: intent.capabilities,
          toolsUsed,
        };
        continue;
      }
      yield chunk;
    }

    // Terminal chunk carries citations (no extra content).
    const lastChar = responseText.trimEnd().slice(-1);
    const truncated = lastChar.length > 0 && !'。.!？！?'.includes(lastChar) && responseText.trimEnd().length > 0;
    yield {
      id: crypto.randomUUID(),
      contentDelta: '',
      done: true,
      truncated: truncated || undefined,
      citations: citations.length ? citations : undefined,
    };

    let quality: QualityFields | undefined;
    if (flags.ENABLE_QUALITY_SCORING) {
      try {
        const memoryResults = results.filter((r) => r.capability === Capability.MEMORY);
        const liveResults = results.filter((r) => r.success && r.capability !== Capability.MEMORY && r.capability !== Capability.RAG && r.payload);
        const scored = new QualityScorer().score({
          memoryResults,
          ragChunks,
          liveResults,
          citations,
          retrievalAnalytics,
          responseLength: responseText.length,
        });
        quality = { ...scored.dimensions, overall: scored.overall };
      } catch {
        quality = undefined;
      }
    }

    const trace: RequestTrace = {
      requestId,
      intentMs,
      capabilities: intent.capabilities,
      toolsUsed: results.map((r) => r.capability),
      cacheHits: this.cache.hits,
      cacheMisses: this.cache.misses,
      providerMs,
      llmMs: llmTimer.stop(),
      totalMs: totalTimer.stop(),
      retrieval: retrievalAnalytics,
      quality,
    };
    logTrace(trace);
  }
}
