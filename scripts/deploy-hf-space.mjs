#!/usr/bin/env node
// Deploy the Jouspace Intelligence Runtime to a free Hugging Face Space (Docker SDK).
//
// Prereqs:
//   - A free HF account + a write token exported as HF_TOKEN
//   - `@huggingface/hub` installed in scripts/ (run: npm install --prefix scripts)
//   - An NVIDIA_API_KEY ready to paste into the Space's secrets after first build
//
// Usage:
//   HF_TOKEN=... [HF_USERNAME=your_hf_user] [HF_SPACE_NAME=jouspace-runtime] \
//     node scripts/deploy-hf-space.mjs
//
// If HF_USERNAME is omitted it is auto-detected from the token via whoAmI,
// which avoids a confusing auth error when the token belongs to a different
// account than the name you typed.
//
// The public Space URL becomes: https://<HF_USERNAME>-<HF_SPACE_NAME>.hf.space
// Set that as the GitHub secret RUNTIME_URL before building the APK.

import { uploadFiles, whoAmI } from '@huggingface/hub';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'server');

const HF_TOKEN = process.env.HF_TOKEN;
const HF_SPACE_NAME = process.env.HF_SPACE_NAME || 'jouspace-runtime';

if (!HF_TOKEN) {
  console.error('✗ Missing env: set HF_TOKEN (a Hugging Face write token).');
  process.exit(1);
}

// Folders/files in server/ that should NOT be uploaded to the Space.
const SKIP_DIRS = new Set(['node_modules', '.git', 'test', 'dist']);
const SKIP_FILES = new Set(['.dockerignore', 'README.md']);

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

// Create the Space via the raw HF API. @huggingface/hub v0.16's createRepo
// hardcodes sdk:"static" for spaces and ignores any docker request, so we
// call /api/repos/create directly with sdk:"docker".
async function createSpace(repo, token) {
  const [, namespace, name] = repo.split('/'); // spaces/<ns>/<name>
  const res = await fetch('https://huggingface.co/api/repos/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      organization: namespace,
      private: false,
      type: 'space',
      sdk: 'docker',
    }),
  });
  if (res.status === 409) return; // already exists — fine for re-deploys
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`createRepo failed (${res.status}): ${txt}`);
  }
}

async function main() {
  // Auto-detect the username so a wrong HF_USERNAME (mismatch with token) can't
  // cause a confusing 401/403 when creating the Space under the wrong namespace.
  let hfUser = process.env.HF_USERNAME;
  if (!hfUser) {
    try {
      const me = await whoAmI({ accessToken: HF_TOKEN });
      hfUser = me.name || me.id;
      console.log(`→ Authenticated as HF user: ${hfUser}`);
    } catch (e) {
      console.error('✗ Failed to authenticate with HF_TOKEN.');
      console.error('  Check the token is valid and has "write" / "create spaces" scope.');
      console.error('  ' + String(e?.message ?? e));
      process.exit(1);
    }
  }

  const repo = `spaces/${hfUser}/${HF_SPACE_NAME}`;

  console.log(`→ Ensuring Space repo ${repo} exists (Docker SDK)...`);
  await createSpace(repo, HF_TOKEN);

  const absFiles = await walk(SERVER_DIR);
  const filePayload = await Promise.all(
    absFiles.map(async (full) => ({
      path: path.relative(SERVER_DIR, full),
      content: new Blob([await readFile(full)]),
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
    { path: 'README.md', content: new Blob([Buffer.from(spaceReadme)]) },
  ];

  console.log(`→ Uploading ${payload.length} files to ${repo}...`);
  await uploadFiles({ repo, accessToken: HF_TOKEN, files: payload });

  console.log('✅ Deploy complete.');
  console.log(`   Space URL: https://${hfUser}-${HF_SPACE_NAME}.hf.space`);
  console.log('   Next: Space Settings → Variables & secrets → add');
  console.log('     NVIDIA_API_KEY (secret), PORT=7860, NODE_ENV=production, GATEWAY_PROVIDER=nvidia');
  console.log('   Then set GitHub secret RUNTIME_URL to the Space URL and build the APK.');
}

main().catch((e) => {
  console.error('✗ Deploy failed:');
  console.error(e?.message ?? e);
  process.exit(1);
});
