/**
 * firebaseClient — Firebase Authentication, used as the identity provider.
 *
 * Firebase handles user identity (Google OAuth, email/password).
 * Profile data (display name, joined date) is stored locally in localStorage.
 * The app is local-first by design — no cloud database layer.
 *
 * Native (Android/iOS) Google sign-in goes through @capacitor-firebase/
 * authentication. Native auth persistence is enabled (`skipNativeAuth: false`
 * in capacitor.config.ts) so the Firebase session survives restarts and the
 * `authStateChange` listener fires symmetrically with the web SDK.
 * On web we use the Firebase JS SDK **redirect** flow (not popup) so sign-in is
 * immune to the popup-blocker / opener issues that can affect `signInWithPopup`
 * on some browsers.
 *
 * Firebase web config is public by design and safe to ship in the client.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim();
const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim();
const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim();
const appId = (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim();

/** True only when real Firebase web-app credentials are present. */
export const isFirebaseConfigured = Boolean(apiKey && authDomain && projectId && appId);

/** Web SDK app — only used for the browser/dev fallback. Never used on native. */
export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? initializeApp({ apiKey, authDomain, projectId, appId })
  : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export { Capacitor, FirebaseAuthentication };

/** A verified Google identity (ID token + profile fields). */
export interface GoogleIdentity {
  uid: string;
  idToken: string;
  email?: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
}

/**
 * Start Google Sign-In and return a verified Google identity.
 * - Native: @capacitor-firebase/authentication (OS-level Google Sign-In).
 * - Web: Firebase JS SDK popup.
 */
export async function getGoogleIdentity(): Promise<GoogleIdentity> {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) {
      throw new Error('Google sign-in did not return an ID token.');
    }
    return {
      uid: result.user?.uid ?? '',
      idToken,
      email: result.user?.email,
      displayName: result.user?.displayName,
    };
  }
  // Web / dev-server fallback.
  if (!firebaseAuth) {
    throw new Error('Firebase is not configured for this platform.');
  }
  const result = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const idToken = credential?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token.');
  }
  return {
    uid: result.user.uid,
    idToken,
    email: result.user.email,
    displayName: result.user.displayName,
  };
}
/**
 * Web-only: start the Google OAuth *redirect* flow. Unlike the popup flow, the
 * redirect performs a full-page navigation to Google and back, so it never
 * touches `window.opener` / `window.frames`. That keeps it robust on browsers
 * where popups are blocked or opener access is restricted.
 */
export async function startWebGoogleSignIn(): Promise<void> {
  if (!firebaseAuth) {
    throw new Error('Firebase is not configured for this platform.');
  }
  await signInWithRedirect(firebaseAuth, new GoogleAuthProvider());
}

/**
 * Web-only: consume a pending Google OAuth redirect result. Call this once on
 * app load (after Google redirects back). Returns the verified identity, or null
 * when there is no pending redirect to process.
 */
export async function getWebGoogleRedirectIdentity(): Promise<GoogleIdentity | null> {
  if (!firebaseAuth) return null;
  try {
    const result = await getRedirectResult(firebaseAuth);
    if (!result) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = credential?.idToken;
    if (!idToken) return null;
    return {
      uid: result.user.uid,
      idToken,
      email: result.user.email,
      displayName: result.user.displayName,
    };
  } catch {
    // A stale/aborted redirect (e.g. the user closed the tab) rejects — ignore.
    return null;
  }
}

/** Sign out of Firebase (best-effort) so the next Google sign-in is fresh. */
export async function signOutFirebase(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    } else {
      await firebaseAuth?.signOut();
    }
  } catch {
    /* non-fatal */
  }
}

// ── Email / Password Authentication ───────────────────────────────────────────

/**
 * Create a new Firebase user with email + password.
 */
export interface FirebaseCredentials {
  idToken: string;
  uid: string;
  email: string;
  emailVerified: boolean;
}

export async function firebaseSignUp(
  email: string,
  password: string,
): Promise<FirebaseCredentials> {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.createUserWithEmailAndPassword({
      email,
      password,
    });
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error('Firebase sign-up did not return an ID token.');
    const uid = result.user?.uid ?? '';
    const userEmail = result.user?.email ?? email;
    return {
      idToken,
      uid,
      email: userEmail,
      emailVerified: result.user?.emailVerified ?? false,
    };
  }
  if (!firebaseAuth) throw new Error('Firebase is not configured for this platform.');
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    uid: result.user.uid,
    email: result.user.email ?? email,
    emailVerified: result.user.emailVerified,
  };
}

/**
 * Sign in an existing Firebase user with email + password.
 */
export async function firebaseSignIn(
  email: string,
  password: string,
): Promise<FirebaseCredentials> {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithEmailAndPassword({
      email,
      password,
    });
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error('Firebase sign-in did not return an ID token.');
    const uid = result.user?.uid ?? '';
    const userEmail = result.user?.email ?? email;
    return {
      idToken,
      uid,
      email: userEmail,
      emailVerified: result.user?.emailVerified ?? false,
    };
  }
  if (!firebaseAuth) throw new Error('Firebase is not configured for this platform.');
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    uid: result.user.uid,
    email: result.user.email ?? email,
    emailVerified: result.user.emailVerified,
  };
}

/**
 * Send a password-reset email via Firebase.
 * - Native: @capacitor-firebase/authentication (works since `skipNativeAuth`
 *   is false and the Firebase project has email/password enabled).
 * - Web: Firebase JS SDK `sendPasswordResetEmail`.
 */
export async function firebaseSendPasswordReset(email: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.sendPasswordResetEmail({ email });
    return;
  }
  if (!firebaseAuth) throw new Error('Firebase is not configured for this platform.');
  await firebaseSendPasswordResetEmail(firebaseAuth, email);
}

/**
 * Send a Firebase email-verification email to the currently signed-in user.
 * - Native: @capacitor-firebase/authentication.
 * - Web: Firebase JS SDK `sendEmailVerification` on `firebaseAuth.currentUser`.
 */
export async function firebaseSendVerification(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.sendEmailVerification();
    return;
  }
  if (!firebaseAuth) throw new Error('Firebase is not configured for this platform.');
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('No signed-in user to verify.');
  await firebaseSendEmailVerification(user);
}

/**
 * A minimal Firebase identity snapshot used for the authoritative auth-state
 * signal. `emailVerified` drives the (soft) email-verification gate.
 */
export interface FirebaseAuthSnapshot {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
}

/**
 * Subscribe to Firebase auth-state changes — the authoritative session source.
 * - Native: @capacitor-firebase/authentication `authStateChange` listener.
 * - Web: Firebase JS SDK `onAuthStateChanged`.
 * Returns an unsubscribe function so React effects can clean up (StrictMode).
 */
export function onFirebaseAuthStateChanged(
  cb: (user: FirebaseAuthSnapshot | null) => void,
): () => void {
  if (Capacitor.isNativePlatform()) {
    let cancelled = false;
    let unsub: (() => void) | null = null;
    void FirebaseAuthentication.addListener('authStateChange', (event) => {
      const u = event.user;
      cb(
        u
          ? {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              emailVerified: u.emailVerified,
            }
          : null,
      );
    }).then((handle) => {
      if (cancelled) void handle.remove();
      else unsub = () => void handle.remove();
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }
  if (!firebaseAuth) return () => {};
  return firebaseOnAuthStateChanged(firebaseAuth, (user: User | null) => {
    cb(
      user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
          }
        : null,
    );
  });
}
