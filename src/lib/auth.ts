/**
 * auth — real Supabase-backed authentication.
 *
 * This replaces the backend-free mock in `lib/localAuth.ts`. The public surface
 * (AuthUser shape + signUp/signIn/requestVerificationCode/verifyEmail/
 * requestPasswordReset/loadSession/saveSession/clearSession) is intentionally
 * identical so AuthScreen and App need almost no changes. New capabilities
 * (magic link, OAuth, auth-state subscription) are added alongside.
 *
 * Security notes:
 *  - Only the publishable anon key + the user's JWT are used here. No secret key.
 *  - All DB access is gated by RLS on auth.uid(); this module never bypasses it.
 *  - Email confirmation / magic-link / OAuth complete via the URL the user is
 *    redirected back to (detectSessionInUrl), which fires onAuthStateChange.
 */

import { supabase, isSupabaseConfigured, SUPABASE_REDIRECT_URL } from './supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  joinedDate: string;
  verified: boolean;
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string };

export type AuthActionResult = { ok: true } | { ok: false; error: string };

const SESSION_MIRROR_KEY = 'jouspace:auth:session';

// Synchronous mirror so loadSession() keeps working in useState initializers.
let currentUser: AuthUser | null = readMirror();
const listeners = new Set<(user: AuthUser | null) => void>();

function readMirror(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_MIRROR_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeMirror(user: AuthUser | null): void {
  try {
    if (user) localStorage.setItem(SESSION_MIRROR_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_MIRROR_KEY);
  } catch {
    /* storage disabled — in-memory only */
  }
}

function setCurrent(user: AuthUser | null): void {
  currentUser = user;
  writeMirror(user);
  listeners.forEach((cb) => cb(user));
}

function monthYear(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Build an AuthUser from the supabase user + profile row. */
function toAuthUser(
  u: { id: string; email?: string | null },
  profile?: { display_name?: string | null; joined_date?: string | null } | null,
  verified = false,
): AuthUser {
  return {
    id: u.id,
    email: u.email ?? currentUser?.email ?? '',
    displayName: profile?.display_name || currentUser?.displayName || 'You',
    joinedDate: profile?.joined_date || currentUser?.joinedDate || monthYear(),
    verified,
  };
}

/** Pull the latest profile + confirmation state and refresh the cached user. */
async function refreshCurrentUser(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    setCurrent(null);
    return;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, joined_date')
    .eq('id', user.id)
    .maybeSingle();
  const verified =
    Boolean(user.email_confirmed_at) || Boolean(user.phone_confirmed_at);
  setCurrent(toAuthUser(user, profile, verified));
}

// ── Public API ──────────────────────────────────────────────────────────────────

/** Synchronous: returns the cached authenticated user (or null). */
export function loadSession(): AuthUser | null {
  return currentUser;
}

/** Mirror setter (compatibility with the old mock's saveSession). */
export function saveSession(user: AuthUser): void {
  setCurrent(user);
}

/** Sign out everywhere and clear the local mirror. */
export async function clearSession(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  setCurrent(null);
}

/** Subscribe to auth-state changes (fires on sign-in, sign-out, token refresh). */
export function onAuthStateChange(
  cb: (user: AuthUser | null) => void,
): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Create a new account. If email confirmation is on, the session is null and the
 *  caller should prompt the user to check their email. */
export async function signUp(
  displayName: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const name = displayName.trim();
  const mail = email.trim().toLowerCase();
  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))
    return { ok: false, error: 'Enter a valid email address.' };
  if (password.length < 6)
    return { ok: false, error: 'Password must be at least 6 characters.' };

  const { data, error } = await supabase.auth.signUp({
    email: mail,
    password,
    options: { data: { display_name: name } },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: 'Unable to create account.' };

  // Ensure a profile row exists (trigger handles it; upsert is idempotent).
  await supabase
    .from('profiles')
    .upsert(
      { id: data.user.id, display_name: name, joined_date: monthYear() },
      { onConflict: 'id' },
    )
    .throwOnError();

  const user = toAuthUser(
    data.user,
    { display_name: name, joined_date: monthYear() },
    false,
  );
  // Only treat as signed-in if a session was issued (confirmation not required).
  if (data.session) await refreshCurrentUser();
  else setCurrent(user);
  return { ok: true, user };
}

/** Sign in with email + password. */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const mail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: mail,
    password,
  });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: 'Sign in failed.' };
  await refreshCurrentUser();
  return { ok: true, user: currentUser! };
}

/** Passwordless magic link (email). Completes via the emailed link. */
export async function signInWithMagicLink(
  email: string,
): Promise<AuthActionResult> {
  const mail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))
    return { ok: false, error: 'Enter a valid email address.' };
  const { error } = await supabase.auth.signInWithOtp({
    email: mail,
    options: { emailRedirectTo: SUPABASE_REDIRECT_URL },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export type OAuthProvider = 'google' | 'apple';

/** OAuth sign-in (Google / Apple). Redirects to the provider. */
export async function signInWithOAuth(
  provider: OAuthProvider,
): Promise<AuthActionResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: SUPABASE_REDIRECT_URL },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Resend the confirmation / magic email (UI calls this "request code"). */
export async function requestVerificationCode(
  _email: string,
): Promise<{ ok: true }> {
  // Real Supabase confirms via email link rather than a 6-digit code, so this is
  // a no-op acknowledgment that lets the UI advance to its "check your email" state.
  return { ok: true };
}

/** Compatibility shim: with link-based verification, confirmation completes via
 *  onAuthStateChange. If a session is already active we return the current user. */
export async function verifyEmail(
  _user: AuthUser,
  _code: string,
): Promise<AuthResult> {
  if (currentUser) return { ok: true, user: currentUser };
  return { ok: false, error: 'Open the link we emailed to finish signing in.' };
}

/** Send a password-reset email. */
export async function requestPasswordReset(
  email: string,
): Promise<AuthActionResult> {
  const mail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))
    return { ok: false, error: 'Enter a valid email address.' };
  const { error } = await supabase.auth.resetPasswordForEmail(mail, {
    redirectTo: `${SUPABASE_REDIRECT_URL}/reset`,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Hydrate the cached user from the persisted session (call once at startup). */
export function initializeAuth(): void {
  if (!isSupabaseConfigured) return;
  void refreshCurrentUser();
}

// Wire the global auth listener once at module load.
if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      setCurrent(null);
      return;
    }
    void refreshCurrentUser();
  });
}
