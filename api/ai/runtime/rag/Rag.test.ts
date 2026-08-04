import { describe, it, expect, vi, afterEach } from 'vitest';
import { PineconeVectorStore } from './vectorStore/PineconeVectorStore';
import { toContextChunks, type QueryResult } from './vectorStore/VectorStore';
import { PineconeRetrievalTool } from './PineconeRetrievalTool';
import { EmbeddingService } from './ingestion/EmbeddingService';
import { IngestionPipeline } from './ingestion/IngestionPipeline';
import type { VectorStore, VectorRecord } from './vectorStore/VectorStore';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.PINECONE_API_KEY;
});

/** In-memory VectorStore stand-in for fast, key-free testing. */
class MemoryVectorStore implements VectorStore {
  private data: Map<string, { values: number[]; metadata: any }> = new Map();
  isConfigured() {
    return true;
  }
  async ensureReady() {}
  async upsert(records: VectorRecord[]) {
    for (const r of records) this.data.set(r.id, { values: r.values, metadata: r.metadata });
  }
  async query(vector: number[], topK: number): Promise<QueryResult[]> {
    return Array.from(this.data.values())
      .map((d) => ({
        id: 'x',
        score: 1 - d.values.reduce((a, b, i) => a + Math.abs(b - (vector[i] ?? 0)), 0) / (vector.length || 1),
        metadata: d.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
  async delete(ids: string[]) {
    for (const id of ids) this.data.delete(id);
  }
  async deleteByDocId(docId: string) {
    const prefix = `${docId}#`;
    let n = 0;
    for (const key of Array.from(this.data.keys())) {
      if (key.startsWith(prefix)) {
        this.data.delete(key);
        n += 1;
      }
    }
    return n;
  }
}

describe('toContextChunks', () => {
  it('maps metadata.text into ContextChunk with score-based confidence', () => {
    const chunks = toContextChunks([
      { id: '1', score: 0.2, metadata: { text: 'CBT is...', source: 'guide' } },
      { id: '2', score: 0.9, metadata: { notext: true } },
    ]);
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe('CBT is...');
    expect(chunks[0].confidence).toBeCloseTo(0.8);
    expect(chunks[0].source).toBe('guide');
  });
});

describe('PineconeVectorStore (no key → safe no-op)', () => {
  it('isConfigured false without PINECONE_API_KEY', () => {
    expect(new PineconeVectorStore().isConfigured()).toBe(false);
  });
  it('query returns [] without key (no throw)', async () => {
    const s = new PineconeVectorStore();
    expect(await s.query([0.1], 3)).toEqual([]);
    await expect(s.upsert([])).resolves.toBeUndefined();
  });
});

describe('PineconeVectorStore (injected client)', () => {
  function fakeClient() {
    const index = {
      upsert: vi.fn(async () => ({})),
      query: vi.fn(async () => ({ matches: [{ id: 'm1', score: 0.3, metadata: { text: 'hi', source: 's' } }] })),
      deleteMany: vi.fn(async () => ({})),
      listPaginated: vi.fn(async () => ({
        vectors: [{ id: 'cbt-guide#0' }, { id: 'cbt-guide#1' }, { id: 'other#0' }],
        pagination: undefined,
      })),
      namespace: () => index,
    };
    return {
      describeIndex: vi.fn(async () => ({ name: 'jouspace-rag' })),
      createIndex: vi.fn(async () => ({})),
      index: vi.fn(() => index),
    } as any;
  }

  it('upserts via records shape and queries', async () => {
    const client = fakeClient();
    const store = new PineconeVectorStore({ client, apiKey: 'k', index: 'jouspace-rag' });
    expect(store.isConfigured()).toBe(true);
    await store.upsert([{ id: 'a', values: [0.1, 0.2], metadata: { text: 'x' } }]);
    const res = await store.query([0.1, 0.2], 2);
    expect(res[0].metadata.text).toBe('hi');
    expect(client.index).toHaveBeenCalled();
  });

  it('deleteByDocId deletes only ${docId}#* chunks and returns the count', async () => {
    const client = fakeClient();
    const store = new PineconeVectorStore({ client, apiKey: 'k', index: 'jouspace-rag' });
    const n = await store.deleteByDocId('cbt-guide');
    expect(n).toBe(2);
    const idx = client.index();
    expect(idx.listPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'cbt-guide#' }),
    );
    expect(idx.deleteMany).toHaveBeenCalledWith({ ids: ['cbt-guide#0', 'cbt-guide#1'] });
  });

  it('deleteByDocId returns 0 when no matching chunks exist', async () => {
    const client = fakeClient();
    const store = new PineconeVectorStore({ client, apiKey: 'k', index: 'jouspace-rag' });
    const n = await store.deleteByDocId('missing-doc');
    expect(n).toBe(0);
    expect(client.index().deleteMany).not.toHaveBeenCalled();
  });
});

describe('PineconeRetrievalTool', () => {
  it('returns [] when store unconfigured', async () => {
    const store = new MemoryVectorStore();
    vi.spyOn(store, 'isConfigured').mockReturnValue(false);
    const emb = new EmbeddingService({ apiKey: 'k', baseUrl: 'https://x' });
    vi.spyOn(emb, 'isConfigured').mockReturnValue(true);
    vi.spyOn(emb, 'embed').mockResolvedValue([0.1, 0.2]);
    const tool = new PineconeRetrievalTool(store, emb);
    expect(await tool.retrieve('CBT')).toEqual([]);
  });

  it('retrieves chunks via VectorStore + embedding', async () => {
    const store = new MemoryVectorStore();
    const emb = new EmbeddingService({ apiKey: 'k', baseUrl: 'https://x' });
    vi.spyOn(emb, 'isConfigured').mockReturnValue(true);
    vi.spyOn(emb, 'embed').mockResolvedValue([0.1, 0.2]);
    await store.upsert([{ id: 'c1', values: [0.1, 0.2], metadata: { text: 'CBT guide', source: 'internal' } }]);
    const tool = new PineconeRetrievalTool(store, emb, { topK: 3 });
    const chunks = await tool.retrieve('what is cbt');
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe('CBT guide');
  });
});

describe('IngestionPipeline', () => {
  it('chunks long text with overlap', () => {
    const pipe = new IngestionPipeline(new MemoryVectorStore(), new EmbeddingService());
    const chunks = pipe.chunk('a'.repeat(2000));
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('ingests: embed + upsert, returns record count', async () => {
    const store = new MemoryVectorStore();
    const emb = new EmbeddingService({ apiKey: 'k', baseUrl: 'https://x' });
    vi.spyOn(emb, 'isConfigured').mockReturnValue(true);
    // embedBatch returns one vector per input chunk.
    vi.spyOn(emb, 'embedBatch').mockImplementation(async (texts: string[]) =>
      texts.map(() => [0.1, 0.2]),
    );
    const spy = vi.spyOn(store, 'upsert');
    const pipe = new IngestionPipeline(store, emb);
    const n = await pipe.ingest({
      id: 'doc1',
      text: 'first passage about CBT. '.repeat(40) + 'second passage about meditation. '.repeat(40),
      source: 'guide',
    });
    expect(n).toBeGreaterThan(1);
    expect(spy).toHaveBeenCalled();
  });
});
