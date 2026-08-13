#!/usr/bin/env bash
# Serve the Jouspace Intelligence Runtime locally AND expose it through a FREE
# public tunnel — no credit card, no Hugging Face account, no Fly account.
#
# Requirements: Node 20+, plus either `cloudflared` (brew install cloudflared)
# or the `ssh` client (built into macOS).
#
# Set NVIDIA_API_KEY in your shell first for real AI responses:
#   export NVIDIA_API_KEY=sk-...
#
# Then:  bash scripts/serve.sh
# It prints a public https://… URL — use that as RUNTIME_URL in the app.

set -euo pipefail

PORT="${PORT:-3001}"
cd "$(dirname "$0")/.."
SERVER_DIR=server

echo "→ Installing server deps…"
( cd "$SERVER_DIR" && npm install --omit=dev --no-audit --no-fund )

echo "→ Starting runtime on :$PORT (NVIDIA_API_KEY read from env)…"
( cd "$SERVER_DIR" && PORT="$PORT" NODE_ENV=production GATEWAY_PROVIDER=nvidia npm start ) &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT INT TERM

echo "→ Waiting for /api/health…"
for _ in $(seq 1 30); do
  curl -sf "http://localhost:$PORT/api/health" >/dev/null 2>&1 && break
  sleep 1
done
curl -s "http://localhost:$PORT/api/health" || echo "(server not responding yet)"

echo ""
echo "→ Opening a FREE public tunnel to http://localhost:$PORT"
if command -v cloudflared >/dev/null 2>&1; then
  echo "   (Cloudflare quick tunnel — no account needed)"
  exec cloudflared tunnel --url "http://localhost:$PORT"
else
  echo "   (localhost.run via ssh — no install needed; public URL prints below)"
  echo "   Use that URL as RUNTIME_URL in the app."
  exec ssh -R 80:localhost:"$PORT" localhost.run
fi
