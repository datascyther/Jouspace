/**
 * auth — Firebase-first authentication.
 *
 * All authentication (Google + email/password) goes through Firebase.
 * Profile data (display name, joined date) is stored locally in localStorage
 * and managed by useProfile. There is no cloud database layer — the app is
 * local-first by design.
 */

import {
  isFirebaseConfigured,
  getGoogleIdentity,
  startWebGoogleSignIn,
  getWebGoogleRedirectIdentity,
  signOutFirebase,
  firebaseSignUp,
  firebaseSignIn,
  firebaseSendPasswordReset,
  firebaseSendVerification,
  onFirebaseAuthStateChanged,
  Capacitor,
  FirebaseAuthentication,
  firebaseAuth,
  type GoogleIdentity,
  type FirebaseCredentials,
} from './firebaseClient';

// Re-export so UI modules can import auth concerns from a single module.
export { isFirebaseConfigured } from './firebaseClient';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  joinedDate: string;
  verified: boolean;
}

/**
 * Local, no-account placeholder user. The app is fully usable without a real
 * cloud sign-in (journaling is local-first).
 */
export const NoAccountUser: AuthUser = {
  id: '',
  email: '',
  displayName: 'You',
  joinedDate: '',
  verified: false,
  noAccount: true,
} as AuthUser & { noAccount: true };

/** Narrowing helper: true when the user is the local no-account placeholder. */
export function isNoAccountUser(user: AuthUser | null): boolean {
  return Boolean(user && (user as AuthUser & { noAccount?: boolean }).noAccount);
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

/** Build an AuthUser from a Firebase user + optional display name. */
function toAuthUser(
  u: { uid: string; email?: string | null; displayName?: string | null },
  displayName?: string,
  joinedDate?: string,
  emailVerified?: boolean,
): AuthUser {
  return {
    id: u.uid,
    email: u.email ?? currentUser?.email ?? '',
    displayName: displayName || currentUser?.displayName || 'You',
    joinedDate: joinedDate || currentUser?.joinedDate || monthYear(),
    verified: emailVerified ?? false,
  };
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
  // Clear local state immediately so the UI transitions without waiting.
  setCurrent(null);
  // Also drop the local-mode bypass flag so the gate re-appears on next launch.
  try {
    localStorage.removeItem('jouspace:auth:bypass');
  } catch {
    /* storage disabled — in-memory only */
  }
  // Fire-and-forget remote sign-out — errors are non-fatal.
  void signOutFirebase().catch(() => {});
}

/** Subscribe to auth-state changes (fires on sign-in, sign-out, token refresh). */
export function onAuthStateChange(
  cb: (user: AuthUser | null) => void,
): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ── Email / Password (Firebase-first) ─────────────────────────────────────────

/**
 * Create a new account via Firebase. Profile data is stored locally.
 */
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

  if (isFirebaseConfigured) {
    try {
      const fb: FirebaseCredentials = await firebaseSignUp(mail, password);
      const user = toAuthUser(
        { uid: fb.uid, email: fb.email },
        name,
        undefined,
        fb.emailVerified,
      );
      setCurrent(user);
      // Fire-and-forget email verification — non-fatal if it fails.
      void firebaseSendVerification().catch(() => {});
      return { ok: true, user };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/already|exists|email-already-in-use/i.test(msg)) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      return { ok: false, error: msg || 'Unable to create account.' };
    }
  }

  return { ok: false, error: 'Authentication is not configured.' };
}

/**
 * Sign in with email + password via Firebase.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const mail = email.trim().toLowerCase();

  if (isFirebaseConfigured) {
    try {
      const fb: FirebaseCredentials = await firebaseSignIn(mail, password);
      const user = toAuthUser(
        { uid: fb.uid, email: fb.email },
        undefined,
        undefined,
        fb.emailVerified,
      );
      setCurrent(user);
      return { ok: true, user };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        /user-not-found|wrong-password|invalid-credential|invalid-email/i.test(msg)
      ) {
        return { ok: false, error: 'Invalid email or password.' };
      }
      if (/too-many-requests/i.test(msg)) {
        return {
          ok: false,
          error: 'Too many attempts. Please try again later.',
        };
      }
      return { ok: false, error: msg || 'Sign in failed.' };
    }
  }

  return { ok: false, error: 'Authentication is not configured.' };
}

// ── Google Sign-In (Firebase) ─────────────────────────────────────────────────

/**
 * Handle a verified Google identity: create a local session from the Firebase
 * credentials. Shared by the native (in-process) and web (post-redirect) paths.
 */
async function handleGoogleIdentity(
  identity: GoogleIdentity,
): Promise<AuthResult> {
  try {
    const user = toAuthUser(
      { uid: identity.uid, email: identity.email, displayName: identity.displayName },
      identity.displayName || undefined,
      undefined,
      identity.emailVerified,
    );
    setCurrent(user);
    return { ok: true, user };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to start Google sign-in. Please try again.',
    };
  }
}

/**
 * Google Sign-In entry point.
 * - Native: the OS sheet returns the identity in-process (no redirect).
 * - Web: we start the Firebase **redirect** flow (not popup). The page navigates
 *   to Google and back; the result is finalized on return via
 *   `completeGoogleRedirectIfPresent()`.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isFirebaseConfigured) {
    return { ok: false, error: 'Google sign-in is not configured yet.' };
  }
  if (Capacitor.isNativePlatform()) {
    return handleGoogleIdentity(await getGoogleIdentity());
  }
  await startWebGoogleSignIn();
  return { ok: false, error: 'Redirecting to Google…' };
}

/**
 * Web-only. Call once on app load. If the page was reached via a Google OAuth
 * redirect, finish sign-in and return the resolved user (null when there is no
 * pending redirect).
 */
export async function completeGoogleRedirectIfPresent(): Promise<AuthUser | null> {
  if (Capacitor.isNativePlatform()) return null;
  if (!isFirebaseConfigured) return null;
  const identity = await getWebGoogleRedirectIdentity();
  if (!identity) return null;
  const res = await handleGoogleIdentity(identity);
  return res.ok ? res.user : null;
}

// ── Email Verification (soft gate) ──────────────────────────────────────────────

/**
 * Re-send the Firebase email-verification email to the currently signed-in
 * user. Non-fatal — the app stays usable (soft gate) if this fails.
 */
export async function resendVerificationEmail(): Promise<AuthActionResult> {
  if (!isFirebaseConfigured) {
    return { ok: false, error: 'Email verification is not configured.' };
  }
  try {
    await firebaseSendVerification();
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || 'Could not send verification email.' };
  }
}

/**
 * Reload the current Firebase user and report whether their email is now
 * verified. Used by the "I've verified — continue" button on the verify screen.
 */
export async function reloadAndCheckVerified(): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    if (Capacitor.isNativePlatform()) {
      const res = await FirebaseAuthentication.getCurrentUser();
      return Boolean(res.user?.emailVerified);
    }
    if (!firebaseAuth) return false;
    const user = firebaseAuth.currentUser;
    if (!user) return false;
    await user.reload();
    return user.emailVerified;
  } catch {
    return false;
  }
}

// ── Password Reset ─────────────────────────────────────────────────────────────

/** Send a password-reset email via Firebase. */
export async function requestPasswordReset(
  email: string,
): Promise<AuthActionResult> {
  const mail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))
    return { ok: false, error: 'Enter a valid email address.' };

  if (isFirebaseConfigured) {
    try {
      await firebaseSendPasswordReset(mail);
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg || 'Password reset failed.' };
    }
  }

  return { ok: false, error: 'Password reset is not configured.' };
}

// ── Initialization ─────────────────────────────────────────────────────────────

// Guards the very first auth-state emit so a transient null (Firebase resolves
// the persisted session asynchronously) doesn't clobber a restored mirror.
let firstAuthEmit = true;
// Ensures we subscribe to Firebase at most once (initializeAuth is called from
// an effect that StrictMode may invoke twice in development).
let authInitialized = false;

/**
 * Wire Firebase auth-state into the local session mirror. When Firebase is
 * configured it is the authoritative session source; every change maps to an
 * AuthUser (carrying `emailVerified`) and notifies local listeners. The
 * localStorage mirror is retained for the no-Firebase / local / bypass modes.
 */
export function initializeAuth(): void {
  if (!isFirebaseConfigured || authInitialized) return;
  authInitialized = true;
  onFirebaseAuthStateChanged((fbUser) => {
    if (!fbUser) {
      // Genuine sign-out (or initial null with no session). Don't overwrite the
      // restored mirror on the very first emit — a persisted session resolves
      // asynchronously and would otherwise be wiped before it arrives.
      if (firstAuthEmit) {
        firstAuthEmit = false;
        return;
      }
      setCurrent(null);
      return;
    }
    firstAuthEmit = false;
    const user = toAuthUser(
      fbUser,
      fbUser.displayName || undefined,
      undefined,
      fbUser.emailVerified,
    );
    setCurrent(user);
  });
}
