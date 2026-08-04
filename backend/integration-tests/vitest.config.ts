import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dir, '../..');

/**
 * Dedicated config for the backend integration tests (Sprint S0.9).
 * Runs against the LIVE prod Supabase project using credentials loaded from
 * `.env.development` / `.env` by `setup.ts` (never hardcoded in source).
 *
 * Run with:  npx vitest run --config backend/integration-tests/vitest.config.ts
 * or:        npm run test:integration
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: dir,
    setupFiles: [path.join(dir, 'setup.ts')],
    include: ['**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Keep prod clean: do not retry; each run uses fresh throwaway identities.
    retry: 0,
    alias: {
      'backend': path.resolve(rootDir, 'backend'),
      '@': path.resolve(rootDir, 'src'),
    },
  },
});

