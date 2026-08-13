import { defineConfig } from 'vitest/config';

// Server tests are pure modules (no DOM). They must NOT inherit the frontend's
// jsdom setup (which references `window`). Run with `--environment node`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: [],
  },
});
