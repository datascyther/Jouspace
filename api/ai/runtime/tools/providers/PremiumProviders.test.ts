import { describe, it, expect, vi, afterEach } from 'vitest';
import { normalizeQuery } from './queryNormalizer';
import { WikipediaProvider } from './WikipediaProvider';
import { ExaProvider, toCitation as exaCite } from './ExaProvider';
import { TavilyProvider, toCitation as tavilyCite } from './TavilyProvider';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('normalizeQuery', () => {
  it('strips question framing', () => {
    expect(normalizeQuery('What is CBT?')).toBe('CBT');
    expect(normalizeQuery('Explain cognitive behavioral therapy')).toBe('cognitive behavioral therapy');
    expect(normalizeQuery('Can you tell me about meditation')).toBe('meditation');
  });
  it('leaves topic queries unchanged', () => {
    expect(normalizeQuery('latest AI news')).toBe('latest AI news');
  });
  it('handles empty input', () => {
    expect(normalizeQuery('')).toBe('');
    expect(normalizeQuery('   ')).toBe('');
  });
});

describe('WikipediaProvider fallback', () => {
  it('falls back to search API when title lookup yields nothing', async () => {
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        call++;
        if (url.includes('list=search')) {
          return {
            ok: true,
            json: async () => ({ query: { search: [{ title: 'Cognitive behavioral therapy' }] } }),
          } as any;
        }
        // First (title) call returns no pages; second (extract by titles) returns the page.
        if (call === 1) {
          return { ok: true, json: async () => ({ query: { pages: {} } }) } as any;
        }
        return {
          ok: true,
          json: async () => ({
            query: {
              pages: {
                '1': {
                  title: 'Cognitive behavioral therapy',
                  fullurl: 'https://en.wikipedia.org/wiki/Cognitive_behavioral_therapy',
                  extract: 'CBT is a psycho-social intervention.',
                },
              },
            },
          }),
        } as any;
      }),
    );
    const r = await new WikipediaProvider().search('What is CBT?');
    expect(r.length).toBe(1);
    expect(r[0].title).toBe('Cognitive behavioral therapy');
  });

  it('returns [] when both title and search fail', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({ query: { pages: {} } }) }) as any);
    const r = await new WikipediaProvider().search('zzz no such topic 9999');
    expect(r).toEqual([]);
  });
});

describe('ExaProvider (premium, optional)', () => {
  it('isConfigured reflects env key', () => {
    const prev = process.env.EXA_API_KEY;
    process.env.EXA_API_KEY = '';
    expect(new ExaProvider().isConfigured()).toBe(false);
    process.env.EXA_API_KEY = 'exa-test-key';
    expect(new ExaProvider().isConfigured()).toBe(true);
    if (prev === undefined) delete process.env.EXA_API_KEY;
    else process.env.EXA_API_KEY = prev;
  });

  it('returns [] when not configured', async () => {
    const prev = process.env.EXA_API_KEY;
    delete process.env.EXA_API_KEY;
    const r = await new ExaProvider().search('anything');
    expect(r).toEqual([]);
    if (prev !== undefined) process.env.EXA_API_KEY = prev;
  });

  it('maps API results to citations with confidence', () => {
    const c = exaCite({ title: 'T', content: 'body', url: 'https://e.com', confidence: 0.88, source: 'Exa' });
    expect(c.source).toBe('Exa');
    expect(c.confidence).toBe(0.88);
    expect(c.url).toBe('https://e.com');
  });
});

describe('TavilyProvider (premium fallback, optional)', () => {
  it('isConfigured reflects env key', () => {
    const prev = process.env.TAVILY_API_KEY;
    process.env.TAVILY_API_KEY = '';
    expect(new TavilyProvider().isConfigured()).toBe(false);
    process.env.TAVILY_API_KEY = 'tav-test-key';
    expect(new TavilyProvider().isConfigured()).toBe(true);
    if (prev === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = prev;
  });

  it('returns [] when not configured', async () => {
    const prev = process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_API_KEY;
    const r = await new TavilyProvider().search('anything');
    expect(r).toEqual([]);
    if (prev !== undefined) process.env.TAVILY_API_KEY = prev;
  });

  it('maps API results to citations with confidence', () => {
    const c = tavilyCite({ title: 'T', content: 'body', url: 'https://t.com', confidence: 0.86, source: 'Tavily' });
    expect(c.source).toBe('Tavily');
    expect(c.confidence).toBe(0.86);
  });
});
