/**
 * Jouspace — AI Runtime: VectorStore abstraction (Phase 4.1)
 *
 * Thin, vendor-neutral interface between the retrieval layer and any vector
 * database. `RetrievalTool` depends ONLY on this — never on Pinecone directly
 * (per Phase 4.0 review: future portability to Qdrant/Weaviate/pgvector etc.
 * without touching the runtime).
 */

import type { ContextChunk } from '../RetrievalTool';

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata: Record<string, string | number | boolean>;
}

export interface VectorStore {
  /** True when the store is configured (key/connection present). */
  isConfigured(): boolean;
  /** Ensure the target index/namespace exists (idempotent). */
  ensureReady(): Promise<void>;
  upsert(records: VectorRecord[]): Promise<void>;
  /** Top-k nearest neighbors for a query vector. */
  query(vector: number[], topK: number): Promise<QueryResult[]>;
  delete(ids: string[]): Promise<void>;
  /**
   * Delete every vector belonging to a document. Chunks are stored as
   * `${docId}#${chunkIndex}`, so a bare docId never matches via {@link delete};
   * implementations must enumerate/prefix-match `${docId}#*` and remove them.
   * Returns the number of chunk vectors deleted. Optional so alternate stores
   * may implement it lazily; callers should feature-detect.
   */
  deleteByDocId?(docId: string): Promise<number>;
}

/** Convert raw vector matches into the ContextChunk shape the runtime consumes. */
export function toContextChunks(results: QueryResult[]): ContextChunk[] {
  return results
    .filter((r) => typeof r.metadata.text === 'string' && r.metadata.text.length > 0)
    .map((r) => ({
      content: String(r.metadata.text),
      source: typeof r.metadata.source === 'string' ? r.metadata.source : 'internal',
      confidence: Math.max(0, Math.min(1, 1 - r.score)),
    }));
}
