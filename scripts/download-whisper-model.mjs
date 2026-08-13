// Download the on-device Whisper model + WASM runtime into public/models/ so the
// app can run fully private, offline voice-to-text (audio never leaves the device).
//
// For STRICT PRIVACY, host these files on YOUR OWN infrastructure (a runtime you
// control) and point `whisper.modelUrl` / `whisper.wasmUrl` in
// src/voice/voiceConfig.ts at your own URLs. The defaults below pull from the
// public @ricky0123/whisper.wasm GitHub release — convenient for local dev, but
// it is a third-party CDN, so self-host before shipping.
//
// Usage (from repo root):
//   node scripts/download-whisper-model.mjs            # base.en (default)
//   node scripts/download-whisper-model.mjs tiny                      # tiny
//   node scripts/download-whisper-model.mjs base.en ./public/models  # custom dir
//
// Requires Node 18+ (global fetch). Run once; re-run to refresh the model.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'https://github.com/ricky0123/whisper.wasm';
const VERSION = 'v1.1.2'; // @ricky0123/whisper.wasm release that ships the assets

// Each model ships a quantized ggml file the worker decodes.
const MODEL_FILES = {
  'tiny': 'ggml-tiny.bin',
  'tiny.en': 'ggml-tiny.en.bin',
  'base': 'ggml-base.bin',
  'base.en': 'ggml-base.en.bin',
  'small': 'ggml-small.bin',
  'small.en': 'ggml-small.en.bin',
};

const WASM_FILE = 'whisper.wasm';

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  process.stdout.write(`→ ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  process.stdout.write(`  saved ${dest} (${(buf.length / 1e6).toFixed(1)} MB)\n`);
}

async function main() {
  const model = process.argv[2] || 'base.en';
  const outDir = resolve(process.argv[3] || join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models'));

  const ggml = MODEL_FILES[model];
  if (!ggml) {
    console.error(`Unknown model "${model}". Choose one of: ${Object.keys(MODEL_FILES).join(', ')}`);
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  const base = `${REPO}/releases/download/${VERSION}`;
  await download(`${base}/${ggml}`, join(outDir, ggml));
  await download(`${base}/${WASM_FILE}`, join(outDir, WASM_FILE));

  // Write a manifest so the app could (optionally) list available local models.
  const manifest = {
    model,
    ggml,
    wasm: WASM_FILE,
    version: VERSION,
    downloadedAt: new Date().toISOString(),
  };
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\nDone. Model + wasm are in ${outDir}`);
  console.log(`Make sure src/voice/voiceConfig.ts points at:`);
  console.log(`  modelUrl: '/models/${ggml}'`);
  console.log(`  wasmUrl:  '/models/'`);
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  console.error('Check your network connection and the release VERSION constant.');
  process.exit(1);
});
