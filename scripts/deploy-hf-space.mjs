#!/usr/bin/env node
// Deploy the Jouspace Intelligence Runtime to a free Hugging Face Space (Docker SDK).
//
// Prereqs:
//   - A free HF account + a write token exported as HF_TOKEN
//   - `npm install` at the repo root (installs @huggingface/hub devDependency)
//   - An NVIDIA_API_KEY ready to paste into the Space's secrets after first build
//
// Usage:
//   HF_TOKEN=... HF_USERNAME=your_hf_user HF_SPACE_NAME=jouspace-runtime \
//     node scripts/deploy-hf-space.mjs
//
// The public Space URL becomes: https://<HF_USERNAME>-<HF_SPACE_NAME>.hf.space
// Set that as the GitHub secret RUNTIME_URL before building the APK.

import { createRepo, uploadFiles } from '@huggingface/hub';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'server');

const HF_TOKEN = process.env.HF_TOKEN;
const HF_USERNAME = process.env.HF_USERNAME;
const HF_SPACE_NAME = process.env.HF_SPACE_NAME || 'jouspace-runtime';

if (!HF_TOKEN || !HF_USERNAME) {
  console.error('Missing env: set HF_TOKEN and HF_USERNAME.');
  process.exit(1);
}

const repo = `spaces/${HF_USERNAME}/${HF_SPACE_NAME}`;

// Files in server/ that should NOT be uploaded to the Space.
const SKIP_DIRS = new Set(['node_modules', '.git', 'test']);
const SKIP_FILES = new Set(['.dockerignore', 'README.md']); // keep server README out; we add a Space README

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await walk(path.join(dir, entry.name))));
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      if (entry.name.endsWith('.test.ts')) continue;
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

async function main() {
  console.log(`→ Ensuring Space repo ${repo} exists (Docker SDK)...`);
  await createRepo({
    repo,
    type: 'space',
    spaceSdk: 'docker',
    token: HF_TOKEN,
    private: false,
  }).catch((e) => {
    // 409 = already exists; that's fine for re-deploys.
    const msg = String(e?.message ?? e);
    if (!msg.includes('409') && !msg.toLowerCase().includes('already exists')) throw e;
  });

  const absFiles = await walk(SERVER_DIR);
  const filePayload = await Promise.all(
    absFiles.map(async (full) => ({
      path: path.relative(SERVER_DIR, full),
      content: await readFile(full),
    }))
  );

  // Space README with the Docker SDK + exposed port. This OVERRIDES the server's
  // architecture README so Hugging Face detects the Space correctly.
  const spaceReadme = `---
title: Jouspace Intelligence Runtime
emoji: 🪐
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
---

# Jouspace Intelligence Runtime

Stateless AI orchestration layer for Jouspace. Proxies to NVIDIA NIM.
Set the \`NVIDIA_API_KEY\` secret in Space settings before first use.
`;

  const payload = [
    ...filePayload,
    { path: 'README.md', content: Buffer.from(spaceReadme) },
  ];

  console.log(`→ Uploading ${payload.length} files to ${repo}...`);
  await uploadFiles({ repo, token: HF_TOKEN, files: payload });

  console.log('✅ Deploy complete.');
  console.log(`   Space URL: https://${HF_USERNAME}-${HF_SPACE_NAME}.hf.space`);
  console.log('   Next: Space Settings → Variables & secrets → add');
  console.log('     NVIDIA_API_KEY (secret), PORT=7860, NODE_ENV=production, GATEWAY_PROVIDER=nvidia');
  console.log('   Then set GitHub secret RUNTIME_URL to the Space URL and build the APK.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
