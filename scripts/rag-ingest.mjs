/**
 * Jouspace — RAG Ingestion Script (Phase 4.1, Sprint 6)
 *
 * Standalone Node script (run via `tsx`, which handles the runtime's TS).
 * Discovers curated documents in scripts/rag-corpus/ (md/json/txt), detects
 * changes via a content-hash manifest, embeds them with NVIDIA, and upserts to
 * the Pinecone index. Removed documents (present in the prior manifest but no
 * longer on disk) have their vectors deleted. Reports ingestion statistics.
 *
 * Sprint 5.5 (Knowledge Freshness): the manifest stores a per-doc version
 * record `{ hash, version, indexedAt, updatedAt }` (backward-compatible with
 * the legacy bare-hash `{ [docId]: "<hash>" }` form). Nightly flow: detect
 * change via manifest hash → deleteByDocId → re-embed → upsert → update
 * manifest; unchanged docs are skipped at zero embedding cost.
 *
 * Source docs: one file = one document; the filename stem becomes the doc id.
 * Front-matter / json metadata is preserved into Pinecone metadata.
 *
 * Usage:
 *   npm run rag:ingest                             # ingest everything
 *   DOCS=doc1,doc2 npm run rag:ingest             # ingest a subset
 *
 * Requires (server-only, in .env):
 *   PINECONE_API_KEY, PINECONE_INDEX, PINECONE_CLOUD, PINECONE_REGION,
 *   NVIDIA_API_KEY, VITE_NVIDIA_BASE_URL, [NVIDIA_EMBED_MODEL]
 *
 * Auto-creates the index on first run if missing. Without PINECONE_API_KEY the
 * script exits cleanly with a config error (no crash).
 */

import { readFileSync, existsSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (no extra dependency).
function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const CORPUS_DIR = resolve(__dirname, 'rag-corpus');
const MANIFEST_PATH = resolve(__dirname, 'rag-corpus', '.rag-manifest.json');

const { PineconeVectorStore } = await import('../api/ai/runtime/rag/vectorStore/PineconeVectorStore.ts');
const { IngestionPipeline } = await import('../api/ai/runtime/rag/ingestion/IngestionPipeline.ts');
const { EmbeddingService } = await import('../api/ai/runtime/rag/ingestion/EmbeddingService.ts');
const { DocumentLoader } = await import('../api/ai/runtime/rag/DocumentLoader.ts');
const { computeVersion } = await import('../api/ai/runtime/rag/ingestion/DocumentVersion.ts');

function hashFile(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Normalize a prior manifest entry into a StoredVersion. Backward-compatible
 * with the legacy bare-hash form (`{ [docId]: "<hash>" }`): a plain string is
 * adopted as a v1 baseline so the first change after upgrade bumps to v2.
 */
function normalizeEntry(prev) {
  if (prev == null) return null;
  if (typeof prev === 'string') {
    return { hash: prev, version: 1, indexedAt: '', updatedAt: '' };
  }
  if (typeof prev === 'object' && typeof prev.hash === 'string') {
    return {
      hash: prev.hash,
      version: typeof prev.version === 'number' && prev.version >= 1 ? prev.version : 1,
      indexedAt: typeof prev.indexedAt === 'string' ? prev.indexedAt : '',
      updatedAt: typeof prev.updatedAt === 'string' ? prev.updatedAt : '',
    };
  }
  return null;
}

async function main() {
  const store = new PineconeVectorStore();
  const embeddings = new EmbeddingService();
  if (!store.isConfigured() || !embeddings.isConfigured()) {
    console.error('[rag-ingest] Missing config. Need PINECONE_API_KEY + NVIDIA_API_KEY + VITE_NVIDIA_BASE_URL in .env');
    process.exit(2);
  }

  await store.ensureReady();

  if (!existsSync(CORPUS_DIR)) {
    console.error(`[rag-ingest] No corpus dir at ${CORPUS_DIR}. Add docs there.`);
    process.exit(1);
  }

  const only = process.env.DOCS ? new Set(process.env.DOCS.split(',').map((s) => s.trim())) : null;

  const loader = new DocumentLoader({ only: only ? Array.from(only) : undefined, defaultSource: 'internal' });
  const docs = loader.discover(CORPUS_DIR);
  if (docs.length === 0) {
    console.error('[rag-ingest] No supported docs (md/json/txt) found in corpus dir.');
    process.exit(1);
  }

  const prevManifest = loadManifest();
  const nextManifest = {};

  const pipe = new IngestionPipeline(store, embeddings);
  let upserted = 0;
  let skipped = 0;
  let deleted = 0;

  // Nightly ingestion (Sprint 5.5 — Knowledge Freshness):
  //   detect change via manifest hash → deleteByDocId → re-embed → upsert →
  //   update manifest; unchanged docs skipped (zero embeddings).
  for (const doc of docs) {
    const textHash = hashFile(doc.text);
    const prev = normalizeEntry(prevManifest[doc.id]);

    if (prev && prev.hash === textHash) {
      // Unchanged: keep the version record verbatim, cost zero embeddings.
      const version = computeVersion(prev, doc.text);
      nextManifest[doc.id] = {
        hash: version.hash,
        version: version.version,
        indexedAt: version.indexedAt,
        updatedAt: version.updatedAt,
      };
      skipped += 1;
      console.log(`[rag-ingest] ${doc.id}: unchanged, skipped (v${version.version})`);
      continue;
    }

    // Changed (or first-ever): bump version, delete stale chunks first so a
    // shrinking chunk count leaves no orphaned `${docId}#*` vectors, then
    // re-embed + upsert.
    const version = computeVersion(prev, doc.text);
    if (prev && typeof store.deleteByDocId === 'function') {
      try {
        const removedChunks = await store.deleteByDocId(doc.id);
        console.log(`[rag-ingest] ${doc.id}: cleared ${removedChunks} stale chunk(s) before re-embed`);
      } catch (e) {
        console.warn(`[rag-ingest] ${doc.id}: pre-reingest delete failed (${e?.message ?? e}); continuing`);
      }
    }

    doc.version = version;
    const n = await pipe.ingestDocument(doc);
    upserted += n;
    nextManifest[doc.id] = {
      hash: version.hash,
      version: version.version,
      indexedAt: version.indexedAt,
      updatedAt: version.updatedAt,
    };
    console.log(`[rag-ingest] ${doc.id}: ${n} chunks upserted (v${version.version})`);
  }

  // Delete vectors for docs that disappeared from disk. Chunks are keyed
  // `${docId}#${i}`, so a bare docId never matches a delete-by-id — we must
  // prefix-match and remove all `${docId}#*` chunks via the store abstraction.
  // (Index-level deletionProtection does NOT block vector deletes; it only
  //  guards the index itself, so remove-deleted works with protection on.)
  const removed = Object.keys(prevManifest).filter((id) => !(id in nextManifest));
  for (const id of removed) {
    if (only && !only.has(id)) continue; // don't prune when running a subset
    let n = 0;
    try {
      if (typeof store.deleteByDocId === 'function') {
        n = await store.deleteByDocId(id);
      } else {
        // Legacy fallback: best-effort delete of the base id.
        await store.delete([id]).catch(() => {});
      }
    } catch (e) {
      console.warn(`[rag-ingest] ${id}: delete failed (${e?.message ?? e}); continuing`);
    }
    deleted += n;
    console.log(`[rag-ingest] ${id}: removed from corpus, ${n} chunk(s) deleted`);
  }

  // Persist manifest (skip when running a subset so we don't wipe other entries).
  if (!only) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(nextManifest, null, 2));
  }

  console.log(
    `[rag-ingest] done. upserted=${upserted} skipped=${skipped} deleted=${deleted} docs=${docs.length}`,
  );
}

main().catch((e) => {
  console.error('[rag-ingest] failed:', e);
  process.exit(1);
});
