/**
 * Jouspace — AI Runtime: Tavily Provider (premium, optional fallback)
 *
 * Used as the FALLBACK web search when TAVILY_API_KEY is set. Returns []
 * when unset. Server-side key only.
 */

import type { Citation } from '../../types';

export interface SearchResult {
  title: string;
  content: string;
  url: string;
  publishedAt?: string;
  snippet?: string;
  confidence: number;
  source: string;
}

export class TavilyProvider {
  readonly name = 'Tavily';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY ?? '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    if (!this.isConfigured()) return [];
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        max_results: limit,
        search_depth: 'basic',
      }),
    });
    if (!res.ok) {
      throw new Error(`Tavily HTTP ${res.status}`);
    }
    const data = await res.json().catch(() => null);
    const results: any[] = data?.results ?? [];
    return results.map((r) => ({
      title: r.title ?? query,
      content: r.content ?? '',
      url: r.url ?? '',
      publishedAt: r.published_date,
      snippet: r.content?.slice(0, 240),
      confidence: 0.86,
      source: this.name,
    }));
  }
}

export function toCitation(r: SearchResult): Citation {
  return {
    title: r.title,
    url: r.url,
    source: r.source,
    publishedAt: r.publishedAt,
    snippet: r.snippet,
    confidence: r.confidence,
  };
}
