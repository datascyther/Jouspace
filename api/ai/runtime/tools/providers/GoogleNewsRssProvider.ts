/**
 * Jouspace — AI Runtime: Google News RSS Provider (free, no key)
 *
 * Parses the Google News RSS search feed into structured headlines. RSS is
 * XML; we do a minimal, dependency-free tag extraction. No prompt building.
 * One bounded retry protects against transient RSS/network blips so a single
 * failed fetch doesn't silently drop all citations.
 */

import type { Citation } from '../../types';

export interface NewsResult {
  title: string;
  content: string;
  url: string;
  publishedAt?: string;
  snippet?: string;
  confidence: number;
  source: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decodeEntities(m[1].trim()) : null;
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\b${attr}="([^"]*)"[^>]*>`, 'i'));
  return m ? m[1] : null;
}

export class GoogleNewsRssProvider {
  readonly name = 'Google News';

  async search(query: string, limit = 5): Promise<NewsResult[]> {
    const q = query.trim();
    if (!q) return [];
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

    let xml = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
        });
        if (!res.ok) continue;
        xml = await res.text().catch(() => '');
        if (xml) break;
      } catch {
        // transient failure — retry once
      }
    }
    if (!xml) return [];

    const items = xml.split(/<item>/i).slice(1);
    const out: NewsResult[] = [];
    for (const item of items.slice(0, limit)) {
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      if (!title || !link) continue;
      const pub = extractTag(item, 'pubDate') ?? undefined;
      const sourceName = extractTag(item, 'source') ?? this.name;
      out.push({
        title,
        content: title,
        url: link,
        publishedAt: pub,
        snippet: title,
        confidence: 0.8,
        source: sourceName,
      });
    }
    return out;
  }
}

export function toCitation(r: NewsResult): Citation {
  return {
    title: r.title,
    url: r.url,
    source: r.source,
    publishedAt: r.publishedAt,
    snippet: r.snippet,
    confidence: r.confidence,
  };
}
