/**
 * AuthService — the ONLY auth entry point the UI is allowed to use.
 *
 * Architecture boundary (Sprint S0.x auth rules):
 *
 *    UI / Feature code
 *         │  (never imports @supabase/supabase-js or backend/client)
 *         ▼
 *    AuthService        ← you are here
 *         │  (never imports @supabase/supabase-js directly)
 *         ▼
 *    AuthRepository      (the only place that touches the Supabase client)
 *         │
 *         ▼
 *    Supabase Auth
 *
 * AuthService adds the application-level concerns on top of the repository:
 *   - in-memory caching of the current session/user (so UI renders instantly),
 *   - a subscribe() API so screens react to sign-in / sign-out / refresh,
 *   - session restore on cold start and explicit refresh on app resume,
 *   - protected-route evaluation helpers.
 */

import { authRepository } from '../repositories/AuthRepository';
import {
  RepositoryError,
  type AuthSession,
  type AuthUser,
} from '../repositories/baseRepository';
import { assertAuthenticated, isRouteProtected, type NotAuthenticatedError } from './authGuard';

export type { AuthSession, AuthUser, NotAuthenticatedError };

type Listener = (session: AuthSession | null, user: AuthUser | null) => void;

class AuthService {
  private session: AuthSession | null = null;
  private user: AuthUser | null = null;
  private listeners = new Set<Listener>();
  private initialized = false;

  /**
   * Restore any persisted session and start listening for auth changes.
   * Call once on app start (before rendering protected routes).
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    try {
      this.session = await authRepository.getSession();
      this.user = this.session ? await authRepository.getCurrentUser() : null;
    } catch {
      this.session = null;
      this.user = null;
    }
    authRepository.onAuthStateChange((_event, session) => {
      this.session = session;
      if (session) {
        // Defer user fetch; getCurrentUser is cheap and keeps cache fresh.
        void authRepository
          .getCurrentUser()
          .then((u) => {
            this.user = u;
            this.emit();
          })
          // Ignore auth errors here (e.g. a SIGNED_OUT event with no session);
          // the catch prevents an unhandled rejection from the background fetch.
          .catch(() => {});
        this.emit();
      } else {
        this.user = null;
        this.emit();
      }
    });
    this.emit();
  }

  // ── State accessors ──────────────────────────────────────────────────────
  isAuthenticated(): boolean {
    return !!this.session?.user;
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  /** Subscribe to auth state. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Push current state immediately.
    listener(this.session, this.user);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) l(this.session, this.user);
  }

  // ── Auth operations (all delegate to AuthRepository) ──────────────────────
  signUp(
    email: string,
    password: string,
    meta?: { display_name?: string; username?: string; [k: string]: unknown },
  ): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    return authRepository.signUp(email, password, meta);
  }

  signIn(email: string, password: string) {
    return authRepository.signIn(email, password);
  }

  signInWithGoogle(redirectTo?: string) {
    return authRepository.signInWithGoogle(redirectTo);
  }

  signInAnonymously() {
    return authRepository.signInAnonymously();
  }

  /** Promote the current anonymous session to a real email/password account. */
  convertAnonymousToEmail(
    email: string,
    password: string,
    meta?: { display_name?: string; name?: string; [key: string]: unknown },
  ) {
    return authRepository.convertAnonymousToEmail(email, password, meta);
  }

  /** Generic OAuth sign-in. `options.skipBrowserRedirect` prevents Supabase
   *  from auto-opening the browser so the caller (e.g. Expo `WebBrowser`) can
   *  control the redirect. */
  signInWithProvider(
    provider: Parameters<typeof authRepository.signInWithProvider>[0],
    options?: Parameters<typeof authRepository.signInWithProvider>[1],
  ) {
    return authRepository.signInWithProvider(provider, options);
  }

  /**
   * Exchange an OAuth redirect URL (returned to the app's deep link after a
   * browser-based sign-in) for a Supabase session. Used by the Expo Google
   * sign-in flow once `WebBrowser.openAuthSessionAsync` resolves.
   */
  getSessionFromUrl(url: string) {
    return authRepository.getSessionFromUrl(url);
  }

  /** Whether the active session is an anonymous (guest) Supabase user. */
  isAnonymous() {
    return authRepository.isAnonymous();
  }

  signOut(): Promise<void> {
    return authRepository.signOut();
  }

  resetPassword(email: string, redirectTo?: string): Promise<void> {
    return authRepository.resetPassword(email, redirectTo);
  }

  updatePassword(newPassword: string): Promise<void> {
    return authRepository.updatePassword(newPassword);
  }

  resendVerificationEmail(email: string, redirectTo?: string): Promise<void> {
    return authRepository.resendVerificationEmail(email, redirectTo);
  }

  refreshSession(): Promise<AuthSession | null> {
    return authRepository.refreshSession();
  }

  // ── Route protection helpers ──────────────────────────────────────────────
  isRouteProtected(route: string): boolean {
    return isRouteProtected(route);
  }

  /** Throws NotAuthenticatedError if not signed in (use in navigation guards). */
  requireAuth(redirectTo = '/sign-in'): void {
    assertAuthenticated(this.session, redirectTo);
  }
}

export const authService = new AuthService();
export { RepositoryError };
export default authService;
