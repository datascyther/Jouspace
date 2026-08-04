import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import type { Database } from './database.types';

// Native builds (Hermes/Metro) only inline *literal* `process.env.EXPO_PUBLIC_*`
// references, so we read the keys explicitly below rather than via a variable.
// `extra` covers the case where static inlining didn't happen (e.g. cached
// bundle); it mirrors src/core/config/env.ts.
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function fromEnv(...candidates: (string | undefined)[]): string {
  for (const value of candidates) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
}

/**
 * React Native session persistence. In an RN/Expo bundle, Supabase Auth needs
 * an AsyncStorage-backed store; in the browser it uses `localStorage`, and in
 * Node (tests) an in-memory store is used by default. We only load
 * AsyncStorage when actually running in React Native, so web/Node builds are
 * untouched.
 */
function resolveRNStorage(): { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void>; removeItem: (k: string) => Promise<void> } | undefined {
  if (typeof navigator === 'undefined' || navigator.product !== 'ReactNative') {
    return undefined;
  }
  try {
    const req = typeof require !== 'undefined' ? require : undefined;
    if (!req) return undefined;
    const mod = req('@react-native-async-storage/async-storage');
    return (mod.default ?? mod.AsyncStorage ?? mod) as never;
  } catch {
    return undefined;
  }
}

const rnStorage = resolveRNStorage();

const url = fromEnv(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  extra.EXPO_PUBLIC_SUPABASE_URL as string | undefined,
  process.env.VITE_SUPABASE_URL,
);
const anonKey = fromEnv(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  extra.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined,
  process.env.VITE_SUPABASE_ANON_KEY,
);

if (!url || !anonKey) {
  // Don't hard-crash on import (e.g. during type-check without env) — the
  // client will simply be inert until env is provided.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / anon key not set; client is inert.',
  );
}

/** Anon (RLS-scoped) client — safe to use anywhere in the app. */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  url || 'http://localhost:54321',
  anonKey || 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...(rnStorage ? { _reactNativeAsyncStorage: rnStorage } : {}),
    },
  },
);

/**
 * SERVER-ONLY client using the service_role key (bypasses RLS).
 * Never import this from UI code. Only export in non-browser environments
 * so RN/web bundlers tree-shake it out of the client bundle.
 */
const isBrowser = typeof window !== 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isClient = isBrowser || isReactNative;

export const createServiceRoleClient =
  !isClient
    ? (roleKey?: string): SupabaseClient<Database> => {
        const key =
          roleKey ||
          fromEnv(
            process.env.SUPABASE_PROD_SERVICE_ROLE_KEY,
            process.env.SUPABASE_DEV_SERVICE_ROLE_KEY,
          );
        if (!key) {
          throw new Error(
            'createServiceRoleClient: no service role key provided (server only).',
          );
        }
        return createClient<Database>(url || 'http://localhost:54321', key, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      }
    : undefined;
