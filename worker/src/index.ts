/**
 * index.ts — Cloudflare Worker entry point for the Jouspace Intelligence Runtime.
 *
 * Replaces server/index.ts (Express). Implements the same contract:
 *   GET  /api/health        → { status, runtime, provider, apiKeyConfigured }
 *   POST /api/ai/chat       → SSE stream
 *   POST /api/ai/reflect    → SSE stream
 *   POST /api/ai/insight    → SSE stream
 *   POST /api/ai/summarize  → SSE stream
 *   POST /api/ai/memory     → SSE stream
 *
 * Config comes from the Worker `env` binding (wrangler.toml [vars] / secrets),
 * not process.env / .env.
 */

import { runCapability } from './handler.js';

export interface Env {
  NVIDIA_API_KEY: string;
  GATEWAY_PROVIDER?: string;
  CORS_ORIGINS?: string;
  /** Set to "false" to disable rate limiting (e.g. local dev). */
  RATE_LIMIT_ENABLED?: string;
}

function parseOrigins(csv?: string): string[] {
  if (!csv) return ['*'];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string, allowed: string[]): Record<string, string> {
  const allow = allowed.includes('*') || allowed.includes(origin) ? (allowed.includes('*') ? '*' : origin) : '';
  const h: Record<string, string> = {};
  if (allow) h['Access-Control-Allow-Origin'] = allow;
  h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
  h['Access-Control-Allow-Headers'] = 'Content-Type, X-User-Id';
  return h;
}

async function handleHealth(env: Env): Promise<Response> {
  return Response.json({
    status: 'ok',
    runtime: 'jouspace-intelligence',
    provider: env.GATEWAY_PROVIDER ?? 'nvidia',
    apiKeyConfigured: Boolean(env.NVIDIA_API_KEY),
    deployedOn: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const allowed = parseOrigins(env.CORS_ORIGINS);
    const origin = request.headers.get('origin') ?? '';
    const cors = corsHeaders(origin, allowed);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/api/health') {
      const res = await handleHealth(env);
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    }

    const aiMatch = url.pathname.match(/^\/api\/ai\/([a-z]+)$/);
    if (aiMatch && request.method === 'POST') {
      const cap = aiMatch[1];
      const opts = {
        apiKey: env.NVIDIA_API_KEY,
        enabledRateLimit: env.RATE_LIMIT_ENABLED !== 'false',
        corsOrigin: cors['Access-Control-Allow-Origin'] ?? '*',
      };
      const res = await runCapability(cap, request, opts);
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    }

    return new Response('Not found', { status: 404 });
  },
};
