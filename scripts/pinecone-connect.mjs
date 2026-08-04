/**
 * Jouspace — Pinecone Connectivity Demo (Phase 4.1)
 *
 * Minimal, runnable Node script that proves the connection to the real
 * `jouspace-rag` Pinecone index works. Reuses the existing PineconeVectorStore
 * so it stays consistent with the runtime wiring. Only prints index metadata —
 * never the API key.
 *
 * Usage:
 *   npx tsx scripts/pinecone-connect.mjs
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- minimal .env loader (same pattern as scripts/pinecone-admin.mjs) ---
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

const { PineconeVectorStore } = await import(
  '../api/ai/runtime/rag/vectorStore/PineconeVectorStore.ts'
);

const store = new PineconeVectorStore();
if (!store.isConfigured()) {
  console.error('[pinecone-connect] Missing PINECONE_API_KEY in .env');
  process.exit(2);
}

const indexName = store.indexName;
const pc = store.client();

console.log('[pinecone-connect] connecting to index: ' + indexName);

const info = await pc.describeIndex(indexName);

console.log('[pinecone-connect] connection OK');
console.log('  index name : ' + info.name);
console.log('  dimension  : ' + info.dimension);
console.log('  metric     : ' + info.metric);
console.log('  status.ready: ' + (info.status?.ready === true));
