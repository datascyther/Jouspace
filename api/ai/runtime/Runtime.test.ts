import { describe, it, expect } from 'vitest';
import { IntentClassifier } from './IntentClassifier';
import { ToolRouter } from './ToolRouter';
import { ToolRegistry, type Tool, type ToolInput } from './tools/Tool';
import { Capability, type ToolResult, type Intent, type FeatureFlags } from './types';
import { getFeatureFlags } from './config';

const allFlags: FeatureFlags = {
  ENABLE_KNOWLEDGE: true,
  ENABLE_NEWS: true,
  ENABLE_WEATHER: true,
  ENABLE_MEDICAL: true,
  ENABLE_MEMORY: true,
  ENABLE_CITATIONS: true,
  ENABLE_RAG: true,
  ENABLE_SEMANTIC_CACHE: true,
  ENABLE_RERANK: true,
  ENABLE_QUERY_REWRITE: true,
  ENABLE_RETRIEVAL_ANALYTICS: true,
  ENABLE_QUALITY_SCORING: true,
  ENABLE_EVALUATION: true,
  ENABLE_MEMORY_EXTRACTION: true,
};

// Fake tool that records it was run.
class FakeTool implements Tool {
  capability: Capability;
  name = 'Fake';
  ranWith = '';
  constructor(cap: Capability) {
    this.capability = cap;
  }
  async run(input: ToolInput): Promise<ToolResult> {
    this.ranWith = input.query;
    return {
      capability: this.capability,
      success: true,
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      sources: [{ title: 'T', url: 'https://t.com', source: 'Fake', confidence: 0.9 }],
      payload: 'data',
    };
  }
}

describe('IntentClassifier (heuristic fallback)', () => {
  const classifier = new IntentClassifier({ classifyViaModel: async () => null });

  it('routes weather keywords to WEATHER', async () => {
    const i = await classifier.classify('what is the weather today?', []);
    expect(i.capabilities).toContain(Capability.WEATHER);
    expect(i.needsSearch).toBe(true);
  });

  it('routes news keywords to NEWS', async () => {
    const i = await classifier.classify('latest AI news?', []);
    expect(i.capabilities).toContain(Capability.NEWS);
  });

  it('routes factual questions to KNOWLEDGE', async () => {
    const i = await classifier.classify('What is CBT?', []);
    expect(i.capabilities).toContain(Capability.KNOWLEDGE);
  });

  it('personal sharing → MEMORY, no search', async () => {
    const i = await classifier.classify('I feel anxious today', []);
    expect(i.capabilities).toContain(Capability.MEMORY);
    expect(i.needsSearch).toBe(false);
  });

  it('model intent overrides heuristic', async () => {
    const c = new IntentClassifier({
      classifyViaModel: async (): Promise<Intent> => ({
        capabilities: [Capability.MEDICAL],
        needsSearch: true,
      }),
    });
    const i = await c.classify('I have a headache', []);
    expect(i.capabilities).toContain(Capability.MEDICAL);
  });
});

describe('ToolRouter', () => {
  it('runs the tool for the resolved capability', async () => {
    const weather = new FakeTool(Capability.WEATHER);
    const knowledge = new FakeTool(Capability.KNOWLEDGE);
    const registry = new ToolRegistry();
    registry.register(weather);
    registry.register(knowledge);
    const router = new ToolRouter(registry, allFlags);

    const results = await router.run(
      { capabilities: [Capability.WEATHER], needsSearch: true },
      { query: 'weather today' },
    );
    expect(results.length).toBe(1);
    expect(results[0].capability).toBe(Capability.WEATHER);
    expect(weather.ranWith).toBe('weather today');
  });

  it('respects feature flags (disabled capability skipped)', async () => {
    const weather = new FakeTool(Capability.WEATHER);
    const registry = new ToolRegistry();
    registry.register(weather);
    const flags: FeatureFlags = { ...allFlags, ENABLE_WEATHER: false };
    const router = new ToolRouter(registry, flags);
    const results = await router.run(
      { capabilities: [Capability.WEATHER], needsSearch: true },
      { query: 'x' },
    );
    expect(results.length).toBe(0);
  });

  it('GENERAL also includes MEMORY context', async () => {
    const memory = new FakeTool(Capability.MEMORY);
    const registry = new ToolRegistry();
    registry.register(memory);
    const router = new ToolRouter(registry, allFlags);
    const results = await router.run(
      { capabilities: [Capability.GENERAL], needsSearch: false },
      { query: 'hi' },
    );
    expect(results.some((r) => r.capability === Capability.MEMORY)).toBe(true);
  });
});

describe('feature flags default', () => {
  it('all enabled by default except RAG', () => {
    const f = getFeatureFlags();
    expect(f.ENABLE_KNOWLEDGE).toBe(true);
    expect(f.ENABLE_RAG).toBe(false);
  });
});
