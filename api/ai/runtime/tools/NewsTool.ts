/**
 * Jouspace — AI Runtime: News Tool (capability NEWS)
 *
 * Primary: Google News RSS (free). Optional Exa news. Structured output only.
 */

import type { Tool, ToolInput } from './Tool';
import { Capability, type ToolResult } from '../types';
import type { CacheManager } from '../cache/CacheManager';
import { GoogleNewsRssProvider, toCitation as newsCite } from './providers/GoogleNewsRssProvider';
import { ExaProvider, toCitation as exaCite } from './providers/ExaProvider';
import { TavilyProvider, toCitation as tavilyCite } from './providers/TavilyProvider';
import { SearchRouter } from './providers/SearchRouter';

export class NewsTool implements Tool {
  readonly capability = Capability.NEWS;
  readonly name = 'NewsTool';

  constructor(
    private cache: CacheManager,
    private news = new GoogleNewsRssProvider(),
    private router = new SearchRouter([new ExaProvider(), new TavilyProvider()]),
  ) {}

  async run(input: ToolInput): Promise<ToolResult> {
    const query = input.query;
    const cached = this.cache.get<ToolResult>(this.capability, query);
    if (cached) return cached;

    const citations = [];
    let payload = '';

    const items = await this.news.search(query);
    for (const r of items) {
      citations.push(newsCite(r));
      payload += `\n\n- ${r.title} (${r.source})${r.publishedAt ? ` — ${r.publishedAt}` : ''})\n${r.url}`;
    }

    // Premium resilient search (Exa → Tavily, shifts on error) supplements the
    // free Google News feed for broader, fresher coverage.
    if (payload.length < 100) {
      const premium = await this.router.search(`${query} news`);
      for (const r of premium) {
        citations.push(r.source === 'Tavily' ? tavilyCite(r) : exaCite(r));
        payload += `\n\n- ${r.title} (${r.source})\n${r.url}`;
      }
    }

    const result: ToolResult = {
      capability: this.capability,
      success: citations.length > 0,
      confidence: citations.length ? Math.max(...citations.map((c) => c.confidence)) : 0,
      timestamp: new Date().toISOString(),
      sources: citations,
      payload: payload.trim(),
    };
    this.cache.set(this.capability, query, result);
    return result;
  }
}
