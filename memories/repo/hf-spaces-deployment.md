---
title: Intelligence Runtime deployment target — Hugging Face Spaces (free)
---

# Runtime deployment: Hugging Face Spaces (free, Public)

The Jouspace Intelligence Runtime (`server/`) is deployed to a **free, Public
Hugging Face Space** (Docker SDK) so the APK can reach it 24/7 at zero cost.

## Why
- Fly.io free tier is NOT always-on (256 MB VMs, bills for 1024 MB); Sprites usage-billed.
- NVIDIA NIM is the only implemented provider gateway (`GATEWAY_PROVIDER=nvidia`).
- User requirement: no spending. HF Spaces free CPU tier is the free 24/7 option.

## Key facts
- Space URL: `https://<hf-username>-jouspace-runtime.hf.space`
- App binds `PORT` (HF sets 7860). `server/Dockerfile` `EXPOSE 7860`.
- Secrets/Variables (Space Settings): `NVIDIA_API_KEY` (secret), `PORT=7860`,
  `NODE_ENV=production`, `GATEWAY_PROVIDER=nvidia`.
- Free tier sleeps ~15 min; cold start 10–30 s. APK handles via thinking state + 1 retry.
- Public URL reachable by anyone; rate limiting + no secret exposure mitigate.

## Deploy tooling
- `scripts/deploy-hf-space.mjs` (Node, `@huggingface/hub` SDK) creates the Space
  (docker SDK) and uploads `server/` + a generated Space `README.md`
  (`sdk: docker`, `app_port: 7860`). Run with `HF_TOKEN`, `HF_USERNAME`,
  optional `HF_SPACE_NAME` (default `jouspace-runtime`).
- `@huggingface/hub` is in root `package.json` devDependencies.
- Plan file: `.kilo/plans/hf-spaces-runtime-deploy-plan.md`.

## APK wiring
- GitHub secret `RUNTIME_URL` = the Space URL (no trailing slash).
- `.github/workflows/build-apk.yml` bakes `VITE_API_BASE_URL` from `RUNTIME_URL`.
- Fly artifacts (`fly.toml`, `.github/workflows/deploy-runtime.yml`) were deleted.

## Bug fixes applied for the image to boot
- Moved `tsx` devDependencies → dependencies in `server/package.json` (container
  runs `npm start` → `tsx index.ts` with `npm ci --omit=dev`).
- Regenerated `server/package-lock.json`.
- `server/.dockerignore` excludes node_modules/.env/test so build context is clean.
