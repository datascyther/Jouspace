/**
 * Jouspace — AI Runtime: Exa Provider (premium, optional)
 *
 * Used as the PRIMARY premium semantic search when EXA_API_KEY is set.
 * No-ops (returns []) when the key is absent so the runtime degrades
 * gracefully to free providers. Reads only server-side env.
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

export class ExaProvider {
  readonly name = 'Exa';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.EXA_API_KEY ?? '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    if (!this.isConfigured()) return [];
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        query,
        numResults: limit,
        contents: { text: true, highlights: true },
      }),
    });
    if (!res.ok) {
      throw new Error(`Exa HTTP ${res.status}`);
    }
    const data = await res.json().catch(() => null);
    const results: any[] = data?.results ?? [];
    return results.map((r) => ({
      title: r.title ?? query,
      content: r.text ?? r.highlights?.join(' ') ?? '',
      url: r.url ?? '',
      publishedAt: r.publishedDate,
      snippet: (r.text ?? '').slice(0, 240),
      confidence: 0.88,
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
