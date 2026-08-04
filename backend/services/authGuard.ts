/**
 * Auth Guard — Protected Route policy
 *
 * Declarative definition of which routes require an authenticated session.
 * The UI/navigation layer asks `isRouteProtected(route)` and calls
 * `assertAuthenticated(session)` before rendering; it never evaluates auth
 * state against Supabase directly.
 *
 * This module is pure and has no Supabase dependency (keeps the auth boundary
 * clean: AuthRepository -> AuthService -> UI).
 */

/** Route segments that require an authenticated session. */
export const PROTECTED_ROUTES: ReadonlySet<string> = new Set([
  'journey',
  'profile',
  'settings',
  'journal',
  'community',
  'progress',
  'recommendations',
]);

/** Returns true if the given route segment requires authentication. */
export function isRouteProtected(route: string): boolean {
  return PROTECTED_ROUTES.has(route) || PROTECTED_ROUTES.has(route.split('/')[0]);
}

/**
 * Throws a `NotAuthenticatedError` if there is no active session.
 * Call this from navigation guards / route loaders before rendering a
 * protected screen.
 */
export class NotAuthenticatedError extends Error {
  constructor(redirectTo = '/sign-in') {
    super(`Authentication required. Redirect to ${redirectTo}.`);
    this.name = 'NotAuthenticatedError';
    this.redirectTo = redirectTo;
    Object.setPrototypeOf(this, NotAuthenticatedError.prototype);
  }
  readonly redirectTo: string;
}

export function assertAuthenticated(
  session: { user: unknown } | null,
  redirectTo = '/sign-in',
): asserts session is { user: unknown } {
  if (!session || !session.user) {
    throw new NotAuthenticatedError(redirectTo);
  }
}
