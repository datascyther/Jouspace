/**
 * Jouspace — AI Runtime: Wikipedia Provider (free, no key)
 *
 * Returns a structured extract + summary. No prompt construction here.
 * Strategy: try a direct title lookup first (handles "CBT", "Paris"), then
 * fall back to the search API when the literal title yields nothing (handles
 * natural-language questions like "What is CBT?"). Both are free.
 */

import type { Citation } from '../../types';
import { normalizeQuery } from './queryNormalizer';

export interface SearchResult {
  title: string;
  content: string;
  url: string;
  publishedAt?: string;
  snippet?: string;
  confidence: number;
  source: string;
}

const WIKI_API = 'https://en.wikipedia.org/w/api.php';

export class WikipediaProvider {
  readonly name = 'Wikipedia';

  async search(query: string): Promise<SearchResult[]> {
    const topic = normalizeQuery(query);
    if (!topic) return [];

    const direct = await this.byTitle(topic);
    if (direct.length > 0) return direct;

    const found = await this.bySearch(topic);
    if (found.length > 0) return found;

    return [];
  }

  /** Direct title lookup (with redirects). */
  private async byTitle(topic: string): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'extracts|info',
      exintro: '1',
      explaintext: '1',
      exsentences: '5',
      inprop: 'url',
      redirects: '1',
      titles: topic,
      origin: '*',
    });

    const res = await fetch(`${WIKI_API}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    if (!data?.query?.pages) return [];

    const out: SearchResult[] = [];
    for (const page of Object.values<any>(data.query.pages)) {
      const extract: string = page.extract ?? '';
      if (!extract) continue;
      out.push(this.toResult(page, topic, extract));
    }
    return out;
  }

  /** Search API fallback for natural-language queries. */
  private async bySearch(topic: string): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'search',
      srsearch: topic,
      srlimit: '3',
      origin: '*',
    });

    const res = await fetch(`${WIKI_API}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    const hits: any[] = data?.query?.search ?? [];
    if (hits.length === 0) return [];

    // Resolve the top hit(s) to extracts.
    const titles = hits.map((h) => h.title).join('|');
    const extractParams = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'extracts|info',
      exintro: '1',
      explaintext: '1',
      exsentences: '5',
      inprop: 'url',
      redirects: '1',
      titles,
      origin: '*',
    });
    const exRes = await fetch(`${WIKI_API}?${extractParams.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!exRes.ok) return [];
    const exData = await exRes.json().catch(() => null);
    if (!exData?.query?.pages) return [];

    const out: SearchResult[] = [];
    for (const page of Object.values<any>(exData.query.pages)) {
      const extract: string = page.extract ?? '';
      if (!extract) continue;
      out.push(this.toResult(page, topic, extract));
    }
    return out;
  }

  private toResult(page: any, topic: string, extract: string): SearchResult {
    const title: string = page.title ?? topic;
    return {
      title,
      content: extract,
      url: page.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      snippet: extract.slice(0, 240),
      confidence: 0.9,
      source: this.name,
    };
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
