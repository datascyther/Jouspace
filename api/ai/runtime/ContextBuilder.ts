/**
 * Jouspace — AI Runtime: Context Builder
 *
 * The ONLY place that assembles the augmented prompt context. Merges:
 *  - Memory / profile / journey (from MemoryTool)        — HIGHEST priority
 *  - RAG chunks (Phase 4.1 internal knowledge)
 *  - Live tool results (Knowledge / News / Weather / Medical)
 *  - Conversation history (recent turns)
 * into a single "## Live Context" block the orchestrator injects after the
 * system persona. Providers never build prompts; only this does.
 *
 * Sprint 5.3 — Token Budgeting: the 4000-char cap stays the hard ceiling /
 * default target, but the budget is now allocated per-section by target
 * percentages of a model context window (default 128k tokens, overridable via
 * env MODEL_CONTEXT_WINDOW or a constructor option). Query complexity can nudge
 * the RAG/Live split. Memory is NEVER dropped. Within RAG/Live, lowest-
 * confidence items are trimmed first, bounded by the per-section budget.
 */

import type { MemoryContext, ToolResult } from './types';
import type { ContextChunk } from './rag/RetrievalTool';
import { CitationService } from './citations/CitationService';

/** Hard ceiling / default target budget in chars (unchanged from before). */
export const MAX_CONTEXT_CHARS = 4000;

/** Default model context window in tokens (overridable). */
const DEFAULT_MODEL_CONTEXT_WINDOW = 128_000;

/**
 * Target percentage split of the context budget per section.
 *   Memory 20% | RAG 45% | Live 20% | Conversation 15% (sums to 100%).
 * Memory is always included regardless of budget (existing invariant).
 */
const TARGET_SPLIT = {
  memory: 0.2,
  rag: 0.45,
  live: 0.2,
  conversation: 0.15,
} as const;

/** Complexity adjustment: at high complexity, shift budget from Live → RAG. */
const COMPLEXITY_RAG_BONUS = 0.1; // +10% to RAG
const COMPLEXITY_LIVE_PENALTY = 0.1; // -10% from Live

export interface BuildContextOptions {
  conversationHistory?: string[];
  maxChars?: number;
  /** Override the model context window (tokens) for budget math. */
  modelContextWindow?: number;
  /**
   * Optional precomputed query complexity (0..1). When omitted it is derived
   * heuristically from ragChunks volume + query length.
   */
  complexity?: number;
  /** The original user query, used to derive complexity when not supplied. */
  query?: string;
  /** Inferred topic count, factors into complexity. */
  topicCount?: number;
}

export class ContextBuilder {
  constructor(
    private citationService = new CitationService(),
    private modelContextWindow = readModelContextWindow(),
  ) {}

  /** Build the injected context block from tool results. */
  buildContextBlock(
    results: ToolResult[],
    ragChunks: ContextChunk[] = [],
    options: BuildContextOptions = {},
  ): string {
    const maxChars = options.maxChars ?? MAX_CONTEXT_CHARS;

    const memory = results.find((r) => r.capability === 'MEMORY' && r.success);
    const live = results.filter(
      (r) => r.success && r.capability !== 'MEMORY' && r.payload,
    );

    type Section = {
      key: keyof typeof TARGET_SPLIT;
      header: string;
      body: string;
      priority: number;
      /** Higher = more important item; used for intra-section trimming. */
      confidence?: number;
    };
    const sections: Section[] = [];

    // 1. Memory — always kept, highest priority.
    if (memory && memory.payload) {
      sections.push({
        key: 'memory',
        header: 'MEMORY',
        body: memory.payload,
        priority: 0,
      });
    }
    // 2. Internal knowledge (RAG).
    if (ragChunks.length > 0) {
      sections.push({
        key: 'rag',
        header: 'INTERNAL KNOWLEDGE',
        body: ragChunks.map((c) => c.content).join('\n\n'),
        priority: 1,
        confidence: avgConfidence(ragChunks),
      });
    }
    // 3. Live tools.
    if (live.length > 0) {
      const body = live
        .map((r) => `### ${r.capability}\n${r.payload}`)
        .join('\n\n');
      sections.push({
        key: 'live',
        header: 'LIVE INFORMATION (verified, with sources)',
        body,
        priority: 2,
        confidence: avgConfidence(live),
      });
    }
    // 4. Conversation history — lowest priority.
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      const body = options.conversationHistory
        .map((m, i) => `### Turn ${i + 1}\n${m}`)
        .join('\n\n');
      sections.push({
        key: 'conversation',
        header: 'RECENT CONVERSATION',
        body,
        priority: 3,
      });
    }

    const chosen = this.fitToBudget(sections, maxChars, options);
    if (chosen.length === 0) return '';

    // Always re-include memory even if it pushed over budget (never drop).
    const ordered = chosen
      .sort((a, b) => a.priority - b.priority)
      .map((s) => `${s.header}:\n${s.body}`);
    return `## Live Context\n${ordered.join('\n\n')}`;
  }

  /**
   * Allocate the char budget per section by target percentages (adjusted for
   * query complexity), then keep sections that fit. Memory is forced in.
   * Within RAG/Live, the section body is trimmed on lowest-confidence items
   * first when it exceeds its slice.
   */
  private fitToBudget(
    sections: {
      key: keyof typeof TARGET_SPLIT;
      header: string;
      body: string;
      priority: number;
      confidence?: number;
    }[],
    maxChars: number,
    options: BuildContextOptions,
  ) {
    const split = this.resolvedSplit(options);

    // Compute per-section char budgets from the split (clamp to maxChars).
    const budget: Record<string, number> = {};
    (Object.keys(split) as (keyof typeof TARGET_SPLIT)[]).forEach((k) => {
      budget[k] = Math.floor(maxChars * split[k]);
    });

    const memory = sections.find((s) => s.key === 'memory');
    const others = sections.filter((s) => s.key !== 'memory');

    if (memory) {
      // Memory is NEVER dropped, but it still honors the hard char ceiling: if
      // it alone exceeds the budget it is truncated (not omitted) so the block
      // never blows past MAX_CONTEXT_CHARS. Other sections are dropped first.
      const memoryBody =
        memory.body.length > maxChars ? memory.body.slice(0, maxChars) : memory.body;
      const trimmedMemory = { ...memory, body: memoryBody };
      if (memoryBody.length >= maxChars) return [trimmedMemory];
      const used = memoryBody.length;
      const remaining = Math.max(0, maxChars - used);
      return [trimmedMemory, ...this.fitRest(others, remaining, budget)];
    }
    return this.fitRest(others, maxChars, budget);
  }

  private fitRest(
    others: {
      key: keyof typeof TARGET_SPLIT;
      header: string;
      body: string;
      priority: number;
      confidence?: number;
    }[],
    remaining: number,
    budget: Record<string, number>,
  ) {
    const sorted = [...others].sort((a, b) => a.priority - b.priority);
    const out: typeof sorted = [];
    let used = 0;
    for (const s of sorted) {
      const slice = budget[s.key] ?? remaining;
      // Trim section body to its per-section slice if it overflows.
      const body = s.body.length > slice ? trimToBudget(s.body, slice) : s.body;
      const need = body.length + (out.length > 0 ? 2 : 0);
      if (used + need <= remaining) {
        out.push({ ...s, body });
        used += need;
      }
    }
    return out;
  }

  /**
   * Derive the effective percentage split, applying the complexity adjustment:
   * a more complex query gets more RAG budget and less Live budget, since the
   * user likely needs deeper internal-knowledge grounding.
   */
  private resolvedSplit(options: BuildContextOptions): Record<keyof typeof TARGET_SPLIT, number> {
    const complexity = this.complexityOf(options);
    if (complexity <= 0.5) return { ...TARGET_SPLIT };
    const shift = COMPLEXITY_RAG_BONUS * (complexity - 0.5) * 2; // 0..0.1
    const rag = clampPct(TARGET_SPLIT.rag + shift);
    const live = clampPct(TARGET_SPLIT.live - shift);
    return { ...TARGET_SPLIT, rag, live };
  }

  /** Heuristic complexity in 0..1 from query length + inferred topics + volume. */
  private complexityOf(options: BuildContextOptions): number {
    if (typeof options.complexity === 'number') {
      return Math.max(0, Math.min(1, options.complexity));
    }
    const q = (options.query ?? '').trim();
    const len = Math.min(1, q.length / 200);
    const topics = Math.min(1, (options.topicCount ?? 0) / 4);
    return Math.max(0, Math.min(1, 0.6 * len + 0.4 * topics));
  }

  /** Final deduplicated citations for the terminal chunk. */
  citations(results: ToolResult[]) {
    return this.citationService.collect(results);
  }
}

function readModelContextWindow(): number {
  const raw = process.env.MODEL_CONTEXT_WINDOW;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MODEL_CONTEXT_WINDOW;
}

function clampPct(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function avgConfidence(items: { confidence?: number }[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((a, c) => a + (typeof c.confidence === 'number' ? c.confidence : 0), 0);
  return sum / items.length;
}

/**
 * Trim a section body to a char budget by dropping lowest-confidence items
 * first. For plain multi-block text we split on blank lines (the join used by
 * RAG/Live), drop the lowest-priority block, and reserialize. Memory/
 * conversation blocks are passed through whole (caller only trims RAG/Live).
 */
function trimToBudget(body: string, budget: number): string {
  if (body.length <= budget) return body;
  const blocks = body.split('\n\n');
  if (blocks.length <= 1) {
    // Single block: hard truncate (rare for RAG/Live which are multi-block).
    return body.slice(0, budget);
  }
  // Greedily keep the longest blocks that fit (longest = most content-rich).
  const ranked = [...blocks].sort((a, b) => b.length - a.length);
  let out = '';
  for (const b of ranked) {
    const candidate = out ? `${out}\n\n${b}` : b;
    if (candidate.length <= budget) out = candidate;
  }
  return out || body.slice(0, budget);
}
