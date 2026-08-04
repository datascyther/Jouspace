import { describe, it, expect, vi, beforeEach } from 'vitest';

const capturedTraces: Array<{ requestId: string; quality?: unknown }> = [];

vi.mock('./config', async () => {
  const actual = await vi.importActual<typeof import('./config')>('./config');
  return {
    ...actual,
    logTrace: (trace: Parameters<typeof actual.logTrace>[0]) => {
      capturedTraces.push({ requestId: trace.requestId, quality: trace.quality });
    },
  };
});

import { AIOrchestrator } from './AIOrchestrator';
import { ToolRegistry, type Tool, type ToolInput } from './tools/Tool';
import { CacheManager } from './cache/CacheManager';
import { Capability, type ToolResult, type StreamChunk, type QualityFields } from './types';

/** Stub gateway: returns a fixed stream, no network. */
class StubGateway {
  async *streamCompletion(): AsyncGenerator<StreamChunk> {
    yield { id: '1', contentDelta: 'Hello ' };
    yield { id: '2', contentDelta: 'world.' };
    yield { id: '3', contentDelta: '', done: true };
  }
}

class KnowledgeToolStub implements Tool {
  capability = Capability.KNOWLEDGE;
  name = 'Stub';
  async run(_input: ToolInput): Promise<ToolResult> {
    return {
      capability: Capability.KNOWLEDGE,
      success: true,
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      sources: [{ title: 'CBT Wiki', url: 'https://en.wikipedia.org/wiki/CBT', source: 'Wikipedia', confidence: 0.9 }],
      payload: 'Cognitive behavioral therapy is...',
    };
  }
}

class MemoryToolStub implements Tool {
  capability = Capability.MEMORY;
  name = 'MemoryStub';
  async run(_input: ToolInput): Promise<ToolResult> {
    return {
      capability: Capability.MEMORY,
      success: true,
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      sources: [],
      payload: 'User previously discussed anxiety.',
    };
  }
}

function buildOrchestrator(): AIOrchestrator {
  const registry = new ToolRegistry();
  registry.register(new KnowledgeToolStub());
  registry.register(new MemoryToolStub());
  return new AIOrchestrator({
    registry,
    cache: new CacheManager(),
    gateway: new StubGateway() as any,
  });
}

describe('AIOrchestrator (acceptance)', () => {
  beforeEach(() => {
    capturedTraces.length = 0;
  });

  it('streams a response and emits terminal citations chunk', async () => {
    const orch = buildOrchestrator();
    const chunks: StreamChunk[] = [];
    for await (const c of orch.handle({
      text: 'What is CBT?',
      uid: 'u1',
      memoryContext: { userName: 'Sam', reflectionStreak: 3 },
    })) {
      chunks.push(c);
    }

    const content = chunks.map((c) => c.contentDelta).join('');
    expect(content).toContain('Hello world.');

    const last = chunks[chunks.length - 1];
    expect(last.done).toBe(true);
    expect(last.citations?.length).toBeGreaterThan(0);
    expect(last.citations?.[0].url).toContain('wikipedia');
  });

  it('injects memory context into the prompt (no crash, memory tool runs)', async () => {
    const orch = buildOrchestrator();
    const chunks = [];
    for await (const c of orch.handle({ text: 'hi', uid: 'u2', memoryContext: { userName: 'Sam' } })) {
      chunks.push(c);
    }
    expect(chunks.some((c) => c.done)).toBe(true);
  });

  it('attaches quality fields to the trace when ENABLE_QUALITY_SCORING is on', async () => {
    const orch = buildOrchestrator();
    for await (const _ of orch.handle({ text: 'What is CBT?', uid: 'u3' })) {
      // consume stream
    }
    expect(capturedTraces.length).toBe(1);
    const trace = capturedTraces[0];
    expect(trace.quality).toBeDefined();
    const q = trace.quality as QualityFields;
    expect(typeof q.memoryQuality).toBe('number');
    expect(typeof q.ragQuality).toBe('number');
    expect(typeof q.liveSearchQuality).toBe('number');
    expect(typeof q.citationCount).toBe('number');
    expect(typeof q.retrievalConfidence).toBe('number');
    expect(typeof q.responseConfidence).toBe('number');
    expect(typeof q.overall).toBe('number');
    expect(q.overall).toBeGreaterThanOrEqual(0);
    expect(q.overall).toBeLessThanOrEqual(1);
  });
});
