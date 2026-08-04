/**
 * Jouspace — AI Runtime: Ingestion Pipeline (Phase 4.1)
 *
 * Turns source documents (CBT guides, meditation scripts, journey lessons,
 * clinical references) into embedded vectors stored in a VectorStore. Pure
 * orchestration of load → clean → chunk → embed → upsert; no provider
 * knowledge leaks here. Degrades to a no-op when embeddings/store are
 * unconfigured.
 *
 * Sprint 1/2 additions: delegates chunking to {@link Chunker}, cleaning to
 * {@link Cleaner}, and carries stable metadata (source/format/docId/chunk/hash)
 * through to Pinecone. Dedup is hash-based: chunks whose normalized content
 * hash already exists (per {@link Deduplicator}) are skipped.
 *
 * Sprint 5.5 (Knowledge Freshness): every chunk also carries document-level
 * version metadata (version/indexedAt/updatedAt/docHash). Re-upserting a
 * changed document overwrites chunk ids (`${docId}#${i}`) idempotently, but the
 * nightly script must {@link VectorStore.deleteByDocId} a changed doc BEFORE
 * re-embedding so shrinking chunk counts leave no orphaned vectors.
 */

import { createHash } from 'crypto';
import type { VectorStore, VectorRecord } from '../vectorStore/VectorStore';
import { EmbeddingService } from './EmbeddingService';
import { Chunker } from '../Chunker';
import { Cleaner } from '../Cleaner';
import type { LoadedDocument } from '../DocumentLoader';
import { hashDocument, type VersionedDoc } from './DocumentVersion';

export interface IngestionPipelineOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  namespace?: string;
}

/** Hash-based deduplication of chunk content (sha256 of normalized text). */
export class Deduplicator {
  private seen = new Set<string>();

  static hash(text: string): string {
    return createHash('sha256')
      .update(text.replace(/\s+/g, ' ').trim().toLowerCase())
      .digest('hex');
  }

  has(text: string): boolean {
    return this.seen.has(Deduplicator.hash(text));
  }

  add(text: string): void {
    this.seen.add(Deduplicator.hash(text));
  }
}

export class IngestionPipeline {
  private chunker = new Chunker();
  private cleaner = new Cleaner();
  private dedup = new Deduplicator();

  constructor(
    private store: VectorStore,
    private embeddings: EmbeddingService,
    private opts: IngestionPipelineOptions = {},
  ) {}

  /** Split text into overlapping chunks (~chunkSize chars). */
  chunk(text: string): string[] {
    return this.chunker.chunk(text, {
      chunkSize: this.opts.chunkSize ?? 800,
      overlap: this.opts.chunkOverlap ?? 120,
    });
  }

  ingestDocument(doc: LoadedDocument): Promise<number> {
    const text = this.cleaner.clean(doc.text);
    return this.ingest({
      id: doc.id,
      text,
      source: doc.source,
      extra: {
        ...(doc.extra ?? {}),
        format: doc.format,
      },
      version: doc.version,
    });
  }

  /** Ingest a document. Returns the number of NEW vectors upserted. */
  async ingest(doc: {
    id: string;
    text: string;
    source: string;
    extra?: Record<string, string | number | boolean>;
    /**
     * Sprint 5.5 — optional document-level version record. When present, its
     * fields (version/indexedAt/updatedAt/hash) are stamped onto every chunk's
     * metadata so freshness is queryable and rerank freshness signals work.
     * When absent, a document-level hash is derived so the metadata `hash` is
     * always present (kept distinct from the per-chunk `hash`).
     */
    version?: VersionedDoc;
  }): Promise<number> {
    if (!this.embeddings.isConfigured()) return 0;
    const chunks = this.chunk(doc.text);
    if (chunks.length === 0) return 0;

    // Document-level version metadata (Sprint 5.5). Falls back to a computed
    // doc hash + version 1 so unversioned callers still carry freshness fields.
    const nowIso = new Date().toISOString();
    const docHash = doc.version?.hash ?? hashDocument(doc.text);
    const versionMeta: Record<string, string | number> = {
      docHash,
      version: doc.version?.version ?? 1,
      indexedAt: doc.version?.indexedAt ?? nowIso,
      updatedAt: doc.version?.updatedAt ?? nowIso,
    };

    // Hash-filter duplicates BEFORE embedding (saves NVIDIA calls).
    const unique: { text: string; hash: string }[] = [];
    for (const c of chunks) {
      const hash = Deduplicator.hash(c);
      if (this.dedup.has(c)) continue;
      this.dedup.add(c);
      unique.push({ text: c, hash });
    }
    if (unique.length === 0) return 0;

    const vectors = await this.embeddings.embedBatch(
      unique.map((u) => u.text),
      { inputType: 'passage' },
    );
    const records: VectorRecord[] = [];
    unique.forEach((u, i) => {
      const vec = vectors[i];
      if (!vec) return;
      records.push({
        id: `${doc.id}#${i}`,
        values: vec,
        metadata: {
          text: u.text,
          source: doc.source,
          docId: doc.id,
          chunk: i,
          hash: u.hash,
          ...versionMeta,
          ...(doc.extra ?? {}),
        },
      });
    });
    if (records.length > 0) await this.store.upsert(records);
    return records.length;
  }
}
