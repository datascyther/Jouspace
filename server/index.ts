/**
 * Jouspace Intelligence Runtime — Server Entry Point
 *
 * Boots the Express application. API keys and provider details are
 * confined to this process. The frontend communicates only with /api/*
 * and never sees provider identity or credentials.
 */

import path from 'path';
import { fileURLToPath } from 'url';
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

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ── Middleware ────────────────────────────────────────────────────────────────

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow local dev origins plus Capacitor/WebView origins, and any extra origins
// provided via CORS_ORIGINS (comma-separated). This lets a deployed APK/PWA
// (whose origin differs from the dev server) reach this runtime.
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
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json({ limit: '64kb' }));

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    runtime: 'jouspace-intelligence',
    timestamp: new Date().toISOString(),
  });
});

// ── Capability Routes ─────────────────────────────────────────────────────────

app.use('/api/ai', chatRouter);
app.use('/api/ai', reflectRouter);
app.use('/api/ai', insightRouter);
app.use('/api/ai', summarizeRouter);

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

export default app;
