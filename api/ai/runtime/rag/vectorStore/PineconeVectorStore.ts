/**
 * Jouspace — AI Runtime: Pinecone VectorStore (Phase 4.1)
 *
 * Implements VectorStore using the official TypeScript SDK. The Pinecone
 * client is constructed lazily and ONLY when a server-side PINECONE_API_KEY is
 * present — importing this module never throws, and without a key every
 * method degrades to a no-op/empty result so the runtime stays stable with
 * RAG disabled or unconfigured.
 *
 * Secrets: PINECONE_API_KEY is server-only (never VITE_*). Index/cloud/region
 * come from env with safe defaults.
 */

import { Pinecone, type Index } from '@pinecone-database/pinecone';
import type { VectorStore, VectorRecord, QueryResult } from './VectorStore';

export interface PineconeConfig {
  apiKey?: string;
  index?: string;
  cloud?: 'aws' | 'gcp' | 'azure';
  region?: string;
  namespace?: string;
  dimension?: number;
  /** Injected for testing; when absent a real client is built from env. */
  client?: Pinecone;
}

export class PineconeVectorStore implements VectorStore {
  private apiKey: string;
  private indexName: string;
  private cloud: 'aws' | 'gcp' | 'azure';
  private region: string;
  private namespace: string;
  private dimension: number;
  private injected?: Pinecone;
  private indexPromise: Promise<Index> | null = null;
  private ensured = false;

  constructor(cfg: PineconeConfig = {}) {
    this.apiKey = cfg.apiKey ?? process.env.PINECONE_API_KEY ?? '';
    this.indexName = cfg.index ?? process.env.PINECONE_INDEX ?? 'jouspace-rag';
    this.cloud = cfg.cloud ?? (process.env.PINECONE_CLOUD as 'aws' | 'gcp' | 'azure') ?? 'aws';
    this.region = cfg.region ?? process.env.PINECONE_REGION ?? 'us-east-1';
    this.namespace = cfg.namespace ?? process.env.PINECONE_NAMESPACE ?? '';
    this.dimension = cfg.dimension ?? Number(process.env.PINECONE_DIMENSION ?? '1024');
    this.injected = cfg.client;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  private client(): Pinecone {
    if (this.injected) return this.injected;
    if (!this.apiKey) throw new Error('PINECONE_API_KEY is not configured (server-only).');
    return new Pinecone({ apiKey: this.apiKey });
  }

  /** Idempotent: create the index if missing, then mark ready. */
  async ensureReady(): Promise<void> {
    if (this.ensured) return;
    if (!this.isConfigured()) {
      throw new Error('PineconeVectorStore.ensureReady called without PINECONE_API_KEY.');
    }
    const pc = this.client();
    const exists = await pc.describeIndex(this.indexName).catch(() => null);
    if (!exists) {
      await pc.createIndex({
        name: this.indexName,
        dimension: this.dimension,
        metric: 'cosine',
        spec: { serverless: { cloud: this.cloud, region: this.region } },
      });
    }
    this.ensured = true;
  }

  private async index(): Promise<Index> {
    if (!this.indexPromise) {
      this.indexPromise = (async () => {
        await this.ensureReady();
        const idx = this.client().index(this.indexName);
        return this.namespace ? idx.namespace(this.namespace) : idx;
      })();
    }
    return this.indexPromise;
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    if (!this.isConfigured() || records.length === 0) return;
    const idx = await this.index();
    const BATCH = 100;
    for (let i = 0; i < records.length; i += BATCH) {
      const slice = records.slice(i, i + BATCH).map((r) => ({
        id: r.id,
        values: r.values,
        metadata: r.metadata,
      }));
      await idx.upsert({ records: slice });
    }
  }

  async query(vector: number[], topK: number): Promise<QueryResult[]> {
    if (!this.isConfigured()) return [];
    const idx = await this.index();
    const res = await idx.query({ vector, topK, includeMetadata: true });
    return (res.matches ?? []).map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: (m.metadata as Record<string, string | number | boolean>) ?? {},
    }));
  }

  async delete(ids: string[]): Promise<void> {
    if (!this.isConfigured() || ids.length === 0) return;
    const idx = await this.index();
    await idx.deleteMany({ ids });
  }

  /**
   * Enumerate every vector in the (optionally namespaced) index. Used by the
   * memory layer to reload a uid's full memory set without a query vector.
   * `listPaginated` returns ids only (no metadata), so we follow up with a
   * single `fetch` to hydrate metadata. Returns bare records (id + metadata).
   */
  async listAll(): Promise<VectorRecord[]> {
    if (!this.isConfigured()) return [];
    const idx = await this.index();
    const ids: string[] = [];
    let paginationToken: string | undefined;
    do {
      const page = await idx.listPaginated({ paginationToken, limit: 100 });
      for (const v of page.vectors ?? []) {
        if (typeof v.id === 'string') ids.push(v.id);
      }
      paginationToken = page.pagination?.next;
    } while (paginationToken);
    if (ids.length === 0) return [];
    const fetched = await idx.fetch({ ids });
    const out: VectorRecord[] = [];
    for (const id of ids) {
      const rec = fetched.records?.[id];
      if (rec?.metadata) {
        out.push({ id, values: [], metadata: rec.metadata as Record<string, string | number | boolean> });
      }
    }
    return out;
  }

  /**
   * Delete all chunk vectors for a document. Chunks are keyed `${docId}#${i}`,
   * so we enumerate ids by prefix (paginating through the index) and delete the
   * matches in batches. Returns the number of chunk vectors deleted.
   *
   * NOTE: index-level `deletionProtection` does NOT block vector deletes — it
   * only guards against deleting the index itself. We still fail soft: if the
   * API rejects a delete (e.g. a future protection mode), we warn and return
   * the count deleted so far rather than aborting ingestion.
   */
  async deleteByDocId(docId: string): Promise<number> {
    if (!this.isConfigured() || !docId) return 0;
    const idx = await this.index();
    const prefix = `${docId}#`;
    let paginationToken: string | undefined;
    let deleted = 0;
    do {
      // Prefer server-side prefix filtering when supported; fall back to
      // client-side matching for portability across SDK/plan variants.
      const page = await idx.listPaginated({ prefix, paginationToken, limit: 100 });
      const ids = (page.vectors ?? [])
        .map((v) => v.id)
        .filter((id): id is string => typeof id === 'string' && id.startsWith(prefix));
      if (ids.length > 0) {
        try {
          await idx.deleteMany({ ids });
          deleted += ids.length;
        } catch (err) {
          console.warn(
            `[PineconeVectorStore] deleteByDocId("${docId}") could not delete ` +
              `${ids.length} chunk(s); continuing. Reason: ${(err as Error)?.message ?? err}`,
          );
          break;
        }
      }
      paginationToken = page.pagination?.next;
    } while (paginationToken);
    return deleted;
  }
}
