/// <reference types="vitest/config" />
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
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

