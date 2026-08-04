import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

/** Mirror public env vars into `process.env` for shared modules (no import.meta). */
function publicEnvDefine(mode: string): Record<string, string> {
  const loaded = loadEnv(mode, process.cwd(), ['EXPO_PUBLIC_', 'VITE_']);
  return Object.fromEntries(
    Object.entries(loaded).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
  );
}

/**
 * Vite plugin: serve the Vercel edge function at /api/ai/chat in dev mode.
 *
 * In production, Vercel routes /api/* to the edge functions automatically.
 * In dev mode (Vite only, no vercel dev), we mount the handler as Express-style
 * middleware so the client can reach /api/ai/chat without CORS issues.
 *
 * The edge function uses the Web Fetch API (Request/Response), which Node 18+
 * supports natively. We bridge the gap between Node's IncomingMessage and the
 * Web Request interface.
 */
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-plugin',
    configureServer(server) {
      const mode = server.config.mode || 'development';
      const loadedEnv = loadEnv(mode, process.cwd(), '');
      Object.assign(process.env, loadedEnv);

      server.middlewares.use(
        '/api/ai/chat',
        async (req: IncomingMessage, res: ServerResponse) => {
          try {
            // Read body
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk as Buffer);
            }
            const bodyBuffer = Buffer.concat(chunks);

            // Build a Web API Request from the Node IncomingMessage
            const origin = `http://${req.headers.host ?? 'localhost:5173'}`;
            const url = `${origin}${req.url ?? '/api/ai/chat'}`;

            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) {
                headers.set(key, Array.isArray(value) ? value.join(', ') : value);
              }
            }

            const webRequest = new Request(url, {
              method: req.method ?? 'POST',
              headers,
              body: req.method !== 'GET' && req.method !== 'HEAD' ? bodyBuffer : undefined,
            });

            // Compile + load the edge handler through Vite's SSR pipeline so TS
            // and extensionless/alias imports resolve like production (Vercel).
            const mod = await server.ssrLoadModule(
              path.resolve(__dirname, './api/ai/chat.ts'),
            );
            const handler = mod.default;

            const webResponse: Response = await handler(webRequest);

            // Copy status and headers
            res.statusCode = webResponse.status;
            webResponse.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });

            // Stream the body
            if (webResponse.body) {
              const reader = webResponse.body.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
            }
            res.end();
          } catch (err) {
            console.error('[api-dev-plugin] Error handling /api/ai/chat:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error in dev API handler' }));
          }
        }
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), apiDevPlugin()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      'backend': path.resolve(__dirname, './backend'),
      'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, './src/utils/codegenNativeComponentMock.ts'),
      'react-native': path.resolve(__dirname, './src/utils/react-native-web-wrapper.ts'),
      'expo-router': path.resolve(__dirname, './src/utils/expo-router-mock.tsx'),
      'expo-clipboard': path.resolve(__dirname, './src/utils/expo-clipboard-mock.ts'),
      'expo-linear-gradient': path.resolve(__dirname, './src/utils/expo-linear-gradient-mock.tsx'),
      'expo-web-browser': path.resolve(__dirname, './src/utils/expo-web-browser-mock.ts'),
      'expo-linking': path.resolve(__dirname, './src/utils/expo-linking-mock.ts'),
      'lottie-react-native': path.resolve(__dirname, './src/utils/lottie-react-native-mock.tsx'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['lucide-react', 'tailwind-merge', 'clsx', 'class-variance-authority'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    open: false,
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: (rewritePath) => rewritePath.replace(/^\/api\/nvidia/, ''),
      },
    },
  },
  base: '/',
  optimizeDeps: {
    disabled: true,
    noDiscovery: true,
    include: [],
  },
  define: {
    global: 'globalThis',
    __DEV__: JSON.stringify(mode !== 'production'),
    'process.env.NODE_ENV': JSON.stringify(mode),
    ...publicEnvDefine(mode),
  },
}));
