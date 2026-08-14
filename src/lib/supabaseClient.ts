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

/**
 * Detect whether the app is running inside a Capacitor native shell.
 * On native, window.location.origin is typically "https://localhost" (the
 * Capacitor default scheme), which does not match the real app origin and
 * must not be used as an OAuth redirect URL.
 */
function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() === true;
}

/**
 * The OAuth / magic-link redirect URL used by Supabase.
 *
 * On native (Capacitor) we use a custom URI scheme so the OS routes the
 * callback back into the app. On web we use the current origin so the
 * callback loads inside the same origin where supabase-js can extract the
 * session from the URL fragment/query.
 *
 * IMPORTANT: register `jouspace://` as an authorised redirect URI in your
 * Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
 */
export function getSupabaseRedirectUrl(): string {
  if (isCapacitorNative()) {
    return 'jouspace://';
  }
  return typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5173';
}

/** Backward-compatible constant (for callers that imported the old name). */
export const SUPABASE_REDIRECT_URL = getSupabaseRedirectUrl();

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
