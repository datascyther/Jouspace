import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import { transform as esbuildTransform } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mirror the reanimated JSX transform from vite.config.ts so .js files
// shipped by react-native-reanimated (which contain JSX) parse correctly.
function reanimatedJsxPlugin() {
  return {
    name: 'reanimated-jsx',
    async transform(code: string, id: string) {
      if (id.includes('react-native-reanimated') && id.endsWith('.js')) {
        const result = await esbuildTransform(code, { loader: 'jsx', jsx: 'transform' });
        return { code: result.code };
      }
      return null;
    },
  };
}

// RN packages (and some project files) ship .js files that contain JSX and/or
// TS syntax (e.g. `typeof` type queries). Transform all .js as tsx so esbuild
// parses both JSX and TS without choking.
function jsxInJsPlugin() {
  return {
    name: 'jsx-in-js',
    async transform(code: string, id: string) {
      const isJsLike = /\.(js|jsx|cjs|mjs)$/.test(id);
      if (isJsLike && !id.endsWith('.d.ts') && !id.includes('node_modules/.vite')) {
        try {
          const result = await esbuildTransform(code, { loader: 'tsx', jsx: 'transform' });
          return { code: result.code };
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[jsx-in-js] FAILED to transform', id, '\n', (e as Error)?.message);
          return null;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [jsxInJsPlugin(), reanimatedJsxPlugin(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.render-test.tsx'],
    exclude: ['node_modules'],
    setupFiles: [path.resolve(__dirname, './vitest.render.setup.ts')],
    server: {
      deps: {
        inline: true,
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      backend: path.resolve(__dirname, './backend'),
      'react-native/Libraries/Utilities/codegenNativeComponent':
        path.resolve(__dirname, './src/utils/codegenNativeComponentMock.ts'),
      'react-native': path.resolve(__dirname, './src/utils/react-native-web-wrapper.ts'),
      'expo-router': path.resolve(__dirname, './src/utils/expo-router-mock.tsx'),
      'expo-clipboard': path.resolve(__dirname, './src/utils/expo-clipboard-mock.ts'),
      'expo-linear-gradient': path.resolve(__dirname, './src/utils/expo-linear-gradient-mock.tsx'),
      'expo-modules-core': path.resolve(__dirname, './src/test-stubs/expo-modules-core-stub.ts'),
      'expo-constants': path.resolve(__dirname, './src/test-stubs/expo-constants-stub.ts'),
      'expo-web-browser': path.resolve(__dirname, './src/test-stubs/expo-web-browser-stub.ts'),
      'expo-linking': path.resolve(__dirname, './src/test-stubs/expo-linking-stub.ts'),
    },
  },
});
