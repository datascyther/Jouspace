/**
 * Integration-test environment loader.
 *
 * Runs BEFORE any test module is imported (via vitest `setupFiles`), so the
 * Supabase client in `../client` reads the credentials from `process.env` at
 * module-load time. We do NOT add a `dotenv` dependency — this is a tiny manual
 * parser that mirrors the variable expansion the app expects.
 *
 * Credentials are loaded ONLY at runtime from gitignored local files:
 *   - `.env`            (gitignored) — holds SUPABASE_PROD_SERVICE_ROLE_KEY
 *   - `.env.development`             — holds the prod anon URL + anon key
 * Nothing here is ever written to a committed file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

function loadEnvFile(file: string, env: NodeJS.ProcessEnv) {
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Expand ${VAR} references against already-loaded vars + process.env.
    value = value.replace(/\$\{([^}]+)\}/g, (_m, name) => env[name] ?? process.env[name] ?? '');
    if (!(key in env)) env[key] = value;
  }
}

// .env.development first (anon URL/key), then .env (server-only service role).
loadEnvFile(path.join(ROOT, '.env.development'), process.env);
loadEnvFile(path.join(ROOT, '.env'), process.env);

// Surface a clear error early if the env was not provisioned.
if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[integration-tests/setup] EXPO_PUBLIC_SUPABASE_URL / anon key missing. ' +
      'Load .env.development (prod anon key) so the test client is configured.',
  );
}
