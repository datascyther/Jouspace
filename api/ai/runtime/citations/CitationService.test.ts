import { describe, it, expect } from 'vitest';
import { CitationService } from './CitationService';
import type { ToolResult } from '../types';
import { Capability } from '../types';

function result(cap: Capability, sources: ToolResult['sources']): ToolResult {
  return {
    capability: cap,
    success: true,
    confidence: sources.length ? Math.max(...sources.map((s) => s.confidence)) : 0,
    timestamp: new Date().toISOString(),
    sources,
    payload: 'x',
  };
}

describe('CitationService', () => {
  it('dedupes by url and sorts newest first', () => {
    const svc = new CitationService();
    const r1 = result(Capability.KNOWLEDGE, [
      { title: 'A', url: 'https://a.com', source: 'Wikipedia', confidence: 0.9 },
      { title: 'B', url: 'https://b.com', source: 'Exa', confidence: 0.8, publishedAt: '2026-01-01' },
    ]);
    const r2 = result(Capability.NEWS, [
      { title: 'A again', url: 'https://a.com', source: 'Wikipedia', confidence: 0.95 },
    ]);
    const cites = svc.collect([r1, r2]);
    expect(cites.length).toBe(2);
    // duplicate https://a.com kept the higher confidence (0.95)
    const a = cites.find((c) => c.url === 'https://a.com')!;
    expect(a.confidence).toBe(0.95);
    // newest first
    expect(cites[0].url).toBe('https://b.com');
  });

  it('renders markdown sources', () => {
    const svc = new CitationService();
    const md = svc.renderMarkdown([
      { title: 'OpenAI', url: 'https://openai.com', source: 'News', confidence: 0.9, publishedAt: '2026-07-17' },
    ]);
    expect(md).toContain('## Sources');
    expect(md).toContain('[OpenAI](https://openai.com)');
  });
});
