/// <reference types="vitest/config" />
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default Intelligence Runtime URL, baked into production builds so the AI chat
// works out-of-the-box. Also feeds index.html's CSP `connect-src` via the
// %VITE_API_BASE_URL% placeholder. Override with VITE_API_BASE_URL at build time
// or the in-app Profile field at runtime.
const RUNTIME_URL =
  process.env.VITE_API_BASE_URL || 'https://jouspace-runtime.jouspace.workers.dev';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  // Ensure VITE_API_BASE_URL is always defined for both `import.meta.env` and the
  // index.html %VITE_API_BASE_URL% replacement, even if not passed via env.
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(RUNTIME_URL),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      // All /api/* requests are forwarded to the Intelligence Runtime.
      // The frontend never sees the runtime port or any provider details.
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        // Never kill a slow AI stream before it reaches the browser. The 9-minute
        // server-side ceiling in StreamController is the real upper bound.
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost/" },
    },
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});

