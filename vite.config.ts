/// <reference types="vitest/config" />
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env values early so both `define` and the HTML plugin can use them.
  const env = loadEnv(mode, process.cwd(), '');

  const RUNTIME_URL =
    env.VITE_API_BASE_URL || 'https://jouspace-runtime.jouspace.workers.dev';
  const SUPABASE_URL = env.VITE_SUPABASE_URL || '';

  // ── Vite env-HTML plugin ────────────────────────────────────────────────────
  // Vite replaces %VITE_*% in index.html only for built-in envs. This tiny
  // plugin scans HTML and replaces %VITE_*% placeholders from the loaded env.
  function htmlEnvPlugin(): import('vite').Plugin {
    return {
      name: 'html-env-replace',
      transformIndexHtml(html) {
        return html.replace(
          /%([A-Z_][A-Z0-9_]*)%/g,
          (_match, name: string) => {
            if (name.startsWith('VITE_')) {
              return env[name] ?? '';
            }
            return _match;
          },
        );
      },
    };
  }

  return {
    plugins: [react(), tailwindcss(), viteSingleFile(), htmlEnvPlugin()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(RUNTIME_URL),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(SUPABASE_URL),
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
  };
});

