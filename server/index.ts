/**
 * Jouspace Intelligence Runtime — Server Entry Point
 *
 * Boots the Express application. API keys and provider details are
 * confined to this process. The frontend communicates only with /api/*
 * and never sees provider identity or credentials.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load .env from the project root (one level above server/).
// Must run before any module that reads process.env.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat.js';
import { reflectRouter } from './routes/reflect.js';
import { insightRouter } from './routes/insight.js';
import { summarizeRouter } from './routes/summarize.js';
import { memoryRouter } from './routes/memory.js';
import { voiceChatRouter } from './routes/voiceChat.js';
import { normalizeKey } from './rateLimit.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// Per-boot salt so request logs never carry the raw anonymous ID and can't be
// trivially correlated across restarts. The ID is opaque client data anyway.
const USER_ID_SALT = crypto.randomBytes(8).toString('hex');

function hashUserId(raw: string | undefined, fallback: string): string {
  const key = normalizeKey(raw, fallback);
  return crypto
    .createHash('sha256')
    .update(USER_ID_SALT)
    .update(key)
    .digest('hex')
    .slice(0, 12);
}

// ── Middleware ────────────────────────────────────────────────────────────────

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow local dev origins plus Capacitor/WebView origins, and any extra origins
// provided via CORS_ORIGINS (comma-separated). This lets a deployed APK/PWA
// (whose origin differs from the dev server) reach this runtime.
// The custom X-User-Id header is also allowed so the browser doesn't block the
// preflight for anonymous-rate-limiting requests coming from the APK WebView.
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost',
];
const EXTRA_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ORIGINS, ...EXTRA_ORIGINS])];

app.use(
  cors({
    origin(origin, cb) {
      // Allow requests with no origin header (curl, native clients, same-origin)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-User-Id'],
  })
);

// Raised from 64kb → 256kb so 20 capped entries + a profile fit comfortably
// without hitting the express.json body limit (413). Each entry content is now
// capped at 8000 chars (see schemas.ts), so this is generous headroom.
// Voice chat pushes it further: a 45s 16kHz WAV clip arrives as ~1.9MB of
// base64 JSON. The audio is schema-capped at 2.5MB (voiceChat.ts), so 2.5mb
// here matches that contract exactly.
app.use(express.json({ limit: '2.5mb' }));

// ── Structured request logger ──────────────────────────────────────────────────
// Tiny JSON-to-stdout logger (no new dependency, no PII, no bodies). Records one
// line per /api/ai/* call so abuse/spend spikes are visible in the runtime logs.
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/ai')) return next();
  const start = Date.now();
  const capability = req.path.replace(/^\/api\/ai\//, '') || 'unknown';
  const userIdHash = hashUserId(
    req.headers['x-user-id'] as string | undefined,
    req.ip ?? 'unknown'
  );
  res.on('finish', () => {
    const ms = Date.now() - start;
    process.stdout.write(
      JSON.stringify({
        ts: new Date().toISOString(),
        capability,
        userId: userIdHash,
        status: res.statusCode,
        ms,
        streamed: res.statusCode === 200,
      }) + '\n'
    );
  });
  next();
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    runtime: 'jouspace-intelligence',
    provider: process.env.GATEWAY_PROVIDER ?? 'nvidia',
    // Never expose the key itself — only whether one is configured.
    apiKeyConfigured: Boolean(process.env.NVIDIA_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ── Capability Routes ─────────────────────────────────────────────────────────

app.use('/api/ai', chatRouter);
app.use('/api/ai', reflectRouter);
app.use('/api/ai', insightRouter);
app.use('/api/ai', summarizeRouter);
app.use('/api/ai', memoryRouter);
app.use('/api/ai', voiceChatRouter);

// ── Global Error Handler ──────────────────────────────────────────────────────
// Never leak stack traces or provider details to the frontend.

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[Runtime Error]', err);
    if (!res.headersSent) {
      res.status(503).json({ error: 'Intelligence unavailable' });
    }
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`\n✦ Jouspace Intelligence Runtime`);
  console.log(`  → Listening on http://localhost:${PORT}`);
  console.log(`  → Health: http://localhost:${PORT}/api/health`);
  console.log(
    `  → Provider: ${process.env.GATEWAY_PROVIDER ?? 'nvidia'} (${
      process.env.NVIDIA_API_KEY ? 'key loaded ✓' : '⚠ NVIDIA_API_KEY missing'
    })\n`
  );
});

// ── Timeouts ───────────────────────────────────────────────────────────────
// Never let the HTTP layer kill a slow but healthy AI stream. Node 26 defaults
// to 0 already; this is explicit + safe. The 9-minute ceiling in
// StreamController is the real upper bound.
server.timeout = 0;
server.requestTimeout = 0;
server.headersTimeout = 0;

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n✦ Jouspace Intelligence Runtime — startup failed\n` +
      `  Port ${PORT} is already in use.\n` +
      `  Run: kill $(lsof -ti:${PORT})  then restart.\n`
    );
    process.exit(1);
  } else {
    throw err;
  }
});

// ── Safety net ────────────────────────────────────────────────────────────────
// Prevent an unhandled promise rejection (e.g. a gateway timeout) from
// taking down the whole server process.

process.on('unhandledRejection', (reason) => {
  console.error('[Runtime] Unhandled rejection:', reason);
  // Do not exit — the rejection was already handled at the route level.
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
// On SIGTERM (container stop) / SIGINT, stop accepting new connections, then
// hard-exit after a ~10s grace so in-flight streams end (the 9-minute ceiling
// or client disconnect aborts the upstream NVIDIA call). No data is lost because
// the runtime is stateless.

let shuttingDown = false;

function gracefulShutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n✦ Jouspace Intelligence Runtime — ${signal} received, shutting down…`);
  server.close(() => {
    console.log('  → Closed listening socket. Exiting.');
    process.exit(0);
  });
  // Hard ceiling: if connections linger past the grace window, exit anyway.
  setTimeout(() => {
    console.log('  → Grace period elapsed, forcing exit.');
    process.exit(0);
  }, 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
