/**
 * Jouspace — Pinecone Admin (Phase 4.1)
 *
 * Programmatic control of the RAG index via the Node SDK (same one the runtime
 * uses). Reads server env from .env. Covers the operations the CLI covers, plus
 * the re-ingest cleanup we discussed (delete-by-prefix for stale chunks).
 *
 * Usage (run via tsx so it can import the runtime's TS VectorStore):
 *   npm run pinecone:describe
 *   npm run pinecone:stats
 *   npm run pinecone:namespaces
 *   npm run pinecone:list                 # sample vector ids
 *   npm run pinecone:query "cbt anxiety"  # top-K nearest to the query
 *   npm run pinecone:delete-prefix cbt-guide   # delete docId#* (stale-chunk cleanup)
 *   npm run pinecone:backups              # list backups (if any)
 *
 * Requires (server-only, in .env): PINECONE_API_KEY, PINECONE_INDEX,
 * PINECONE_CLOUD, PINECONE_REGION.
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

const { PineconeVectorStore } = await import('../api/ai/runtime/rag/vectorStore/PineconeVectorStore.ts');
const { EmbeddingService } = await import('../api/ai/runtime/rag/ingestion/EmbeddingService.ts');

const store = new PineconeVectorStore();
if (!store.isConfigured()) {
  console.error('[pinecone-admin] Missing PINECONE_API_KEY / PINECONE_INDEX in .env');
  process.exit(2);
}

const cmd = process.argv[2];
const arg = process.argv[3];

function client() {
  return store.client();
}
function indexName() {
  return store.indexName;
}

async function main() {
  switch (cmd) {
    case 'describe': {
      const info = await client().describeIndex(indexName());
      console.log(JSON.stringify(info, null, 2));
      break;
    }
    case 'stats': {
      const idx = client().index(indexName());
      const stats = await idx.describeIndexStats();
      console.log(JSON.stringify(stats, null, 2));
      break;
    }
    case 'namespaces': {
      const idx = client().index(indexName());
      const stats = await idx.describeIndexStats();
      console.log('namespaces:', Object.keys(stats.namespaces ?? {}));
      break;
    }
    case 'list': {
      const idx = client().index(indexName());
      const out = await idx.listPaginated({ limit: 20 });
      console.log('sample ids:', (out.vectors ?? []).map((v) => v.id));
      if (out.pagination && out.pagination.next) console.log('more pages available:', out.pagination.next);
      break;
    }
    case 'query': {
      const emb = new EmbeddingService();
      if (!emb.isConfigured()) {
        console.error('[pinecone-admin] NVIDIA embeddings not configured (need NVIDIA_API_KEY + VITE_NVIDIA_BASE_URL).');
        process.exit(2);
      }
      const q = arg ?? 'cbt anxiety';
      const vec = await emb.embed(q, { inputType: 'query' });
      if (!vec) {
        console.error('[pinecone-admin] embedding failed');
        process.exit(1);
      }
      const res = await store.query(vec, 5);
      console.log('top ' + res.length + ' for "' + q + '":');
      for (const r of res) {
        console.log('  score=' + r.score.toFixed(3) + ' src=' + r.metadata.source + ' :: ' + String(r.metadata.text).slice(0, 80));
      }
      break;
    }
    case 'delete-prefix': {
      if (!arg) {
        console.error('[pinecone-admin] usage: delete-prefix <docId>  (deletes docId#*)');
        process.exit(1);
      }
      // Use the store's paginated prefix delete so we catch chunks beyond the
      // first page and handle protection/soft-fail consistently with ingest.
      const n = await store.deleteByDocId(arg);
      if (n === 0) {
        console.log('[pinecone-admin] no chunks with prefix "' + arg + '#" found.');
      } else {
        console.log('[pinecone-admin] deleted ' + n + ' chunk(s) with prefix "' + arg + '#".');
      }
      break;
    }
    case 'backups': {
      try {
        const b = await client().listBackups({ index: indexName() });
        console.log(JSON.stringify(b ?? {}, null, 2));
      } catch (e) {
        console.log('backups API not available via SDK here:', e.message);
      }
      break;
    }
    default:
      console.log('Unknown or missing command: ' + (cmd ?? '(none)'));
      console.log('Commands: describe | stats | namespaces | list | query [text] | delete-prefix <docId> | backups');
      process.exit(1);
  }
}

main().catch((e) => {
  console.error('[pinecone-admin] failed:', e);
  process.exit(1);
});
