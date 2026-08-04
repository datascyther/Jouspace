/**
 * AI Runtime — Verification Sprint
 *
 * Adversarial tests. Goal: try to break the runtime and prove every failure
 * mode degrades gracefully (returns a useful answer / empty result, never
 * crashes the conversation). Covers: long conversations, mixed-capability
 * sequences, cache hit/miss/expiry, concurrency, streaming interruption/retry,
 * disabled providers, and provider/LLM failure injection.
 *
 * These run against stubbed gateways/providers so they're deterministic and
 * need no network. Each test asserts the orchestrator still yields a terminal
 * `done` chunk and never throws uncaught.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { AIOrchestrator } from '../AIOrchestrator';
import { ToolRegistry, type Tool, type ToolInput } from '../tools/Tool';
import { CacheManager } from '../cache/CacheManager';
import { MemoryCache } from '../cache/MemoryCache';
import * as configModule from '../config';
import { getFeatureFlags } from '../config';
import { Capability, type ToolResult, type StreamChunk, type AIRequest } from '../types';

// ── Fault-injecting stub gateway ──────────────────────────────────────
class FaultGateway {
  constructor(
    private opts: {
      latencyMs?: number;
      fail?: boolean;
      chunks?: string[];
    } = {},
  ) {}

  async *streamCompletion(): AsyncGenerator<StreamChunk> {
    if (this.opts.latencyMs) {
      await new Promise((r) => setTimeout(r, this.opts.latencyMs));
    }
    if (this.opts.fail) {
      throw new Error('Nemotron timeout');
    }
    const chunks = this.opts.chunks ?? ['Ok.'];
    for (let i = 0; i < chunks.length; i++) {
      yield { id: String(i), contentDelta: chunks[i] };
    }
    yield { id: 'done', contentDelta: '', done: true };
  }
}

// ── Fault-injecting tool stubs ───────────────────────────────────────
class FaultTool implements Tool {
  capability: Capability;
  name = 'Fault';
  constructor(
    cap: Capability,
    private behavior: 'ok' | 'throw' | 'empty' | 'malformed' = 'ok',
  ) {
    this.capability = cap;
  }
  async run(_input: ToolInput): Promise<ToolResult> {
    if (this.behavior === 'throw') throw new Error('provider boom');
    if (this.behavior === 'empty') {
      return { capability: this.capability, success: false, confidence: 0, timestamp: new Date().toISOString(), sources: [], payload: '' };
    }
    if (this.behavior === 'malformed') {
      // missing required fields / wrong shape — router must tolerate
      return {
        capability: this.capability,
        success: true,
        confidence: 0.7,
        timestamp: new Date().toISOString(),
        sources: [{ title: 'X', url: 'not-a-url', source: 'Weird', confidence: 0.7 }],
        payload: 'partial',
      };
    }
    return {
      capability: this.capability,
      success: true,
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      sources: [{ title: 'Src', url: 'https://s.com', source: 'S', confidence: 0.9 }],
      payload: 'good',
    };
  }
}

async function collect(orch: AIOrchestrator, req: AIRequest): Promise<StreamChunk[]> {
  const out: StreamChunk[] = [];
  for await (const c of orch.handle(req)) out.push(c);
  return out;
}

function buildOrchestrator(opts: {
  gateway?: any;
  tools?: Tool[];
  flags?: Partial<Record<string, boolean>>;
}): AIOrchestrator {
  const registry = new ToolRegistry();
  for (const t of opts.tools ?? []) registry.register(t);
  // Feature flags default-on; allow override
  vi.spyOn(configModule, 'getFeatureFlags').mockImplementation(() => ({
    ENABLE_KNOWLEDGE: true,
    ENABLE_NEWS: true,
    ENABLE_WEATHER: true,
    ENABLE_MEDICAL: true,
    ENABLE_MEMORY: true,
    ENABLE_CITATIONS: true,
    ENABLE_RAG: false,
    ...(opts.flags ?? {}),
  } as any));
  return new AIOrchestrator({ registry, cache: new CacheManager(), gateway: opts.gateway ?? new FaultGateway() });
}

afterEach(() => vi.restoreAllMocks());

describe('Verification: long conversations', () => {
  it('handles 120-message history without error', async () => {
    const orch = buildOrchestrator({ tools: [new FaultTool(Capability.MEMORY, 'ok')] });
    const history = Array.from({ length: 120 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `msg ${i}`,
    }));
    const chunks = await collect(orch, { text: 'still here', uid: 'u', history });
    expect(chunks[chunks.length - 1].done).toBe(true);
    expect(chunks.map((c) => c.contentDelta).join('')).toContain('Ok.');
  });
});

describe('Verification: mixed-capability sequence', () => {
  it('weather → memory → news → general → knowledge all return answers', async () => {
    const orch = buildOrchestrator({
      tools: [
        new FaultTool(Capability.WEATHER, 'ok'),
        new FaultTool(Capability.MEMORY, 'ok'),
        new FaultTool(Capability.NEWS, 'ok'),
        new FaultTool(Capability.KNOWLEDGE, 'ok'),
      ],
    });
    const seq = [
      'what is the weather today?',
      'I feel calm',
      'latest ai news',
      'hi there',
      'what is cbt',
    ];
    for (const text of seq) {
      const chunks = await collect(orch, { text, uid: 'u' });
      expect(chunks[chunks.length - 1].done).toBe(true);
    }
  });
});

describe('Verification: cache', () => {
  it('repeated identical requests are idempotent (cache layer covers this; see CacheManager.test)', async () => {
    // The CacheManager unit test proves hit/miss/expiry. Here we assert the
    // orchestrator stays deterministic and never crashes under repetition.
    const orch = buildOrchestrator({ tools: [new FaultTool(Capability.KNOWLEDGE, 'ok')] });
    const a = await collect(orch, { text: 'what is cbt', uid: 'u' });
    const b = await collect(orch, { text: 'what is cbt', uid: 'u' });
    const contentA = a.map((c) => c.contentDelta).join('');
    const contentB = b.map((c) => c.contentDelta).join('');
    expect(contentA).toBe(contentB);
    expect(a[a.length - 1].done && b[b.length - 1].done).toBe(true);
  });

  it('TTL expiry re-fetches', async () => {
    let runs = 0;
    class CountingTool implements Tool {
      capability = Capability.WEATHER;
      name = 'Count';
      async run(_i: ToolInput): Promise<ToolResult> {
        runs++;
        return { capability: this.capability, success: true, confidence: 0.9, timestamp: new Date().toISOString(), sources: [], payload: 'x' };
      }
    }
    const store = new MemoryCache();
    // Seed an already-expired entry directly in the store.
    store.set(
      `WEATHER:current`,
      { capability: Capability.WEATHER, success: true, confidence: 0.9, timestamp: new Date().toISOString(), sources: [], payload: 'stale' },
      -1,
    );
    const cm = new CacheManager(store);
    const registry = new ToolRegistry();
    registry.register(new CountingTool());
    const orch = new AIOrchestrator({ registry, cache: cm, gateway: new FaultGateway() });
    await collect(orch, { text: 'weather?', uid: 'u' });
    expect(runs).toBe(1);
  });

  it('concurrent identical requests do not crash', async () => {
    const orch = buildOrchestrator({ tools: [new FaultTool(Capability.KNOWLEDGE, 'ok')] });
    const reqs = Array.from({ length: 8 }, () => collect(orch, { text: 'what is cbt', uid: 'u' }));
    const results = await Promise.all(reqs);
    expect(results.length).toBe(8);
    expect(results.every((r) => r[r.length - 1].done)).toBe(true);
  });
});

describe('Verification: streaming resilience', () => {
  it('interrupted stream (gate closes early) still ends with done', async () => {
    class EarlyCloseGateway {
      async *streamCompletion(): AsyncGenerator<StreamChunk> {
        yield { id: '1', contentDelta: 'partial ' };
        // simulate abrupt end without explicit done — orchestrator still emits terminal citation chunk
        return;
      }
    }
    const orch = buildOrchestrator({ gateway: new EarlyCloseGateway(), tools: [new FaultTool(Capability.MEMORY, 'ok')] });
    const chunks = await collect(orch, { text: 'hi', uid: 'u' });
    expect(chunks[chunks.length - 1].done).toBe(true);
  });

  it('retry: a failed first attempt then success still produces a useful answer', async () => {
    // Simulates transient failure on the first real completion call.
    // Note: the classifier also uses the gateway; we force failure on the
    // first completion regardless, so the first conversation may error but
    // the runtime must recover and still stream on retry.
    let failedOnce = false;
    class FlakyGateway {
      async *streamCompletion(): AsyncGenerator<StreamChunk> {
        if (!failedOnce) {
          failedOnce = true;
          throw new Error('transient');
        }
        yield { id: '1', contentDelta: 'recovered ' };
        yield { id: '2', contentDelta: '', done: true };
      }
    }
    const orch = buildOrchestrator({ gateway: new FlakyGateway(), tools: [new FaultTool(Capability.MEMORY, 'ok')] });
    // First call may reject (error surfaced as terminal error chunk by chat.ts)
    // or resolve empty — either way it must NOT hang.
    try {
      await collect(orch, { text: 'hi', uid: 'u' });
    } catch {
      // expected transient failure path
    }
    // Second call recovers and streams a useful answer.
    const chunks = await collect(orch, { text: 'hi', uid: 'u' });
    expect(chunks.map((c) => c.contentDelta).join('')).toContain('recovered');
    expect(chunks[chunks.length - 1].done).toBe(true);
  });
});

describe('Verification: disabled / missing providers', () => {
  it('disabling Wikipedia still answers knowledge via fallback heuristic (no tool)', async () => {
    // No KNOWLEDGE tool registered, flag on → router simply runs nothing for it.
    const orch = buildOrchestrator({ tools: [new FaultTool(Capability.MEMORY, 'ok')] });
    const chunks = await collect(orch, { text: 'what is cbt', uid: 'u' });
    expect(chunks[chunks.length - 1].done).toBe(true);
    expect(chunks.map((c) => c.contentDelta).join('')).toContain('Ok.');
  });

  it('disabling all live capabilities leaves memory-only path working', async () => {
    const orch = buildOrchestrator({
      tools: [new FaultTool(Capability.MEMORY, 'ok'), new FaultTool(Capability.WEATHER, 'ok')],
      flags: { ENABLE_KNOWLEDGE: false, ENABLE_NEWS: false, ENABLE_WEATHER: false, ENABLE_MEDICAL: false },
    });
    const chunks = await collect(orch, { text: 'I feel anxious', uid: 'u' });
    expect(chunks[chunks.length - 1].done).toBe(true);
  });
});

describe('Verification: provider/LLM failures degrade gracefully', () => {
  it('news timeout → still returns an answer (no crash)', async () => {
    const orch = buildOrchestrator({
      tools: [new FaultTool(Capability.NEWS, 'throw'), new FaultTool(Capability.MEMORY, 'ok')],
    });
    const chunks = await collect(orch, { text: 'latest ai news', uid: 'u' });
    expect(chunks[chunks.length - 1].done).toBe(true);
  });

  it('weather failure → still answers', async () => {
    const orch = buildOrchestrator({
      tools: [new FaultTool(Capability.WEATHER, 'throw'), new FaultTool(Capability.MEMORY, 'ok')],
    });
    const chunks = await collect(orch, { text: 'weather today', uid: 'u' });
    expect(chunks[chunks.length - 1].done).toBe(true);
  });

  it('wikipedia unavailable (empty) → answers without sources', async () => {
    const orch = buildOrchestrator({ tools: [new FaultTool(Capability.KNOWLEDGE, 'empty')] });
    const chunks = await collect(orch, { text: 'what is cbt', uid: 'u' });
    const last = chunks[chunks.length - 1];
    expect(last.done).toBe(true);
    expect(last.citations).toBeUndefined();
  });

  it('malformed provider response → citation service tolerates bad url', async () => {
    const orch = buildOrchestrator({ tools: [new FaultTool(Capability.KNOWLEDGE, 'malformed')] });
    const chunks = await collect(orch, { text: 'what is cbt', uid: 'u' });
    const last = chunks[chunks.length - 1];
    expect(last.done).toBe(true);
    // bad url is skipped by CitationService dedup, so no citations leaked
    expect(last.citations).toBeUndefined();
  });

  it('nemotron timeout → orchestrator throws (chat.ts converts to terminal error chunk, not a hang)', async () => {
    const orch = buildOrchestrator({ gateway: new FaultGateway({ fail: true }), tools: [new FaultTool(Capability.MEMORY, 'ok')] });
    await expect(collect(orch, { text: 'hi', uid: 'u' })).rejects.toThrow('Nemotron timeout');
  });

  it('all providers throw → memory-only answer still streams', async () => {
    const orch = buildOrchestrator({
      tools: [
        new FaultTool(Capability.KNOWLEDGE, 'throw'),
        new FaultTool(Capability.NEWS, 'throw'),
        new FaultTool(Capability.WEATHER, 'throw'),
        new FaultTool(Capability.MEDICAL, 'throw'),
        new FaultTool(Capability.MEMORY, 'ok'),
      ],
    });
    const chunks = await collect(orch, { text: 'I feel sad and want the news and weather', uid: 'u' });
    expect(chunks[chunks.length - 1].done).toBe(true);
    expect(chunks.map((c) => c.contentDelta).join('')).toContain('Ok.');
  });
});
