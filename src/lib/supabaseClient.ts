/**
 * supabaseClient — single shared Supabase client for the frontend.
 *
 * Reads the project URL + anon (publishable) key from Vite env vars:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY   (set in .env, never committed)
 *
 * The anon key is safe to ship to the browser — Row Level Security enforces
 * per-user access. The service_role key is NEVER used here (server-side only).
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

/** True only when real project credentials are present. */
export const isSupabaseConfigured = Boolean(rawUrl && rawKey);

// Use a harmless placeholder when unconfigured so `createClient` never throws
// (the app still boots; calls simply fail until credentials are supplied).
const SUPABASE_URL = rawUrl || 'http://localhost:54321';
const SUPABASE_ANON_KEY = rawKey || 'public-anon-key-placeholder';

export const SUPABASE_REDIRECT_URL =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Handles magic-link / OAuth callback fragments (?code=/#access_token=).
    detectSessionInUrl: true,
    storageKey: 'jouspace:supabase:auth',
    flowType: 'pkce',
  },
});
