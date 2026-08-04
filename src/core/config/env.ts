/**
 * Cross-platform environment configuration for Jouspace.
 *
 * Each value uses static `process.env.EXPO_PUBLIC_*` / `process.env.VITE_*`
 * references so Metro (Expo) and Vite can inline them at build time.
 * Do not use dynamic keys or `import.meta.env` — Hermes does not support import.meta.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function pick(...candidates: (string | undefined)[]): string {
  for (const value of candidates) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return '';
}

function isTruthyFlag(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export const env = {
  firebaseApiKey: pick(
    extra.EXPO_PUBLIC_FIREBASE_API_KEY as string | undefined,
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    process.env.VITE_FIREBASE_API_KEY,
  ),
  firebaseAuthDomain: pick(
    extra.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string | undefined,
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.VITE_FIREBASE_AUTH_DOMAIN,
  ),
  firebaseProjectId: pick(
    extra.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string | undefined,
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.VITE_FIREBASE_PROJECT_ID,
  ),
  firebaseStorageBucket: pick(
    extra.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET as string | undefined,
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    process.env.VITE_FIREBASE_STORAGE_BUCKET,
  ),
  firebaseMessagingSenderId: pick(
    extra.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  firebaseAppId: pick(
    extra.EXPO_PUBLIC_FIREBASE_APP_ID as string | undefined,
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    process.env.VITE_FIREBASE_APP_ID,
  ),
  firebaseMeasurementId: pick(
    extra.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID as string | undefined,
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    process.env.VITE_FIREBASE_MEASUREMENT_ID,
  ),

  apiBaseUrl: (() => {
    const configured = pick(
      extra.EXPO_PUBLIC_API_BASE_URL as string | undefined,
      process.env.EXPO_PUBLIC_API_BASE_URL,
      process.env.VITE_API_BASE_URL,
    );
    if (configured) return configured;

    if (Platform.OS !== 'web') {
      const hostUri = Constants.expoConfig?.hostUri || '';
      const host = hostUri.split(':')[0];
      return host ? `http://${host}:5173/api` : 'http://localhost:5173/api';
    }
    return '/api';
  })(),

  useFirebaseEmulators:
    isTruthyFlag(extra.EXPO_PUBLIC_USE_FIREBASE_EMULATORS as string | undefined) ||
    isTruthyFlag(process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS) ||
    isTruthyFlag(process.env.VITE_USE_FIREBASE_EMULATORS),

  sentryDsn: pick(
    extra.EXPO_PUBLIC_SENTRY_DSN as string | undefined,
    process.env.EXPO_PUBLIC_SENTRY_DSN,
  ),

  appEnv: pick(
    extra.APP_ENV as string | undefined,
    process.env.APP_ENV,
  ) || 'development',

  appName: 'Jouspace',
  appVersion: '1.0.0',
  isDev: __DEV__,

  /**
   * When true (default), chat routes through the server-side AI Runtime
   * (api/ai/chat.ts) so LLM + search keys stay server-only. Set
   * VITE_USE_EDGE_RUNTIME=false to call NVIDIA directly (offline/dev only).
   */
  useEdgeRuntime: (() => {
    const raw = pick(
      extra.VITE_USE_EDGE_RUNTIME as string | undefined,
      process.env.VITE_USE_EDGE_RUNTIME,
      process.env.EXPO_PUBLIC_USE_EDGE_RUNTIME,
    );
    if (raw === '') return true;
    return raw === 'true' || raw === '1';
  })(),

  zenmuxApiKey: pick(
    extra.VITE_ZENMUX_API_KEY as string | undefined,
    process.env.VITE_ZENMUX_API_KEY,
  ),
  zenmuxBaseUrl: pick(
    extra.VITE_ZENMUX_BASE_URL as string | undefined,
    process.env.VITE_ZENMUX_BASE_URL,
  ) || 'https://zenmux.ai/api/v1',
  zenmuxModel: pick(
    extra.VITE_ZENMUX_MODEL as string | undefined,
    process.env.VITE_ZENMUX_MODEL,
  ),
} as const;

export type Env = typeof env;
