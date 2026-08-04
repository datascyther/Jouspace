/**
 * Jouspace — AI Runtime: Citation Service (Sprint D)
 *
 * Normalizes every ToolResult's sources into a deduplicated citation list with
 * a per-response confidence. Deduplicates by URL so the same source from two
 * tools appears once. The orchestrator attaches the final list to the
 * terminal streamed chunk so the UI can render trusted sources.
 */

import type { Citation, ToolResult } from '../types';

export class CitationService {
  /** Merge + dedupe citations across tool results, newest first. */
  collect(results: ToolResult[]): Citation[] {
    const byUrl = new Map<string, Citation>();
    for (const r of results) {
      for (const c of r.sources) {
        // Skip citations without a usable http(s) link so the UI never
        // renders a broken source. Graceful degradation over crashing.
        if (!/^https?:\/\//i.test(c.url)) continue;
        const existing = byUrl.get(c.url);
        if (!existing || c.confidence > existing.confidence) {
          byUrl.set(c.url, c);
        }
      }
    }
    return Array.from(byUrl.values()).sort(
      (a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
    );
  }

  /** Overall confidence across all results (max observed). */
  confidence(results: ToolResult[]): number {
    const vals = results.flatMap((r) => r.sources.map((s) => s.confidence));
    return vals.length ? Math.max(...vals) : 0;
  }

  /** Render a markdown Sources block for injection into the prompt. */
  renderMarkdown(citations: Citation[]): string {
    if (citations.length === 0) return '';
    const lines = citations.map((c, i) => {
      const when = c.publishedAt ? ` (${c.publishedAt})` : '';
      return `${i + 1}. [${c.title}](${c.url}) — ${c.source}${when}`;
    });
    return `## Sources\n${lines.join('\n')}`;
  }
}
