/**
 * Base Repository
 *
 * Shared foundation for every Supabase-backed repository in the Jouspace backend
 * layer. Provides:
 *   - a single `supabase` (anon, RLS-scoped) client instance,
 *   - consistent error handling that converts Postgrest / auth errors into a
 *     typed `RepositoryError`,
 *   - a `getCurrentUserId()` helper used to stamp `user_id` on inserts.
 *
 * RULE (Sprint S0.5): this is the ONLY place that talks to the Supabase client
 * on behalf of feature/UI code. Nothing here imports `@supabase/supabase-js`
 * except the `supabase` client and the re-exported `SupabaseClient` type.
 */

import { supabase } from 'backend/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

/**
 * Supabase auth payload types, derived from the typed client so that
 * repositories never import `@supabase/supabase-js` directly (Sprint S0.5 rule).
 */
type Client = SupabaseClient<Database>;
export type AuthSession = Awaited<ReturnType<Client['auth']['getSession']>>['data']['session'];
export type AuthUser = Awaited<ReturnType<Client['auth']['getUser']>>['data']['user'];
export type AuthSubscription = ReturnType<
  Client['auth']['onAuthStateChange']
>['data']['subscription'];
export type AuthErrorType = Awaited<
  ReturnType<Client['auth']['signInWithPassword']>
>['error'];

/**
 * Sentinel UUID returned by `getCurrentUserId()` when there is no active
 * session. PostgREST accepts it as a valid UUID value that won't match any
 * real row, avoiding `invalid input syntax for type uuid: "null"` errors.
 */
export const GUEST_UID = '00000000-0000-0000-0000-000000000000';

/** All public tables in the Jouspace schema. */
export type AppTables = Database['public']['Tables'];
export type TableName = keyof AppTables;

/**
 * Typed error thrown by every repository when a query fails. Carries the
 * underlying Postgrest/auth `code` (and `details`/`hint` when present) so
 * callers can branch on it.
 */
export class RepositoryError extends Error {
  readonly code?: string;
  readonly details?: unknown;
  readonly hint?: string;

  constructor(
    message: string,
    options: { code?: string; details?: unknown; hint?: string } = {},
  ) {
    super(message);
    this.name = 'RepositoryError';
    this.code = options.code;
    this.details = options.details;
    this.hint = options.hint;
    Object.setPrototypeOf(this, RepositoryError.prototype);
  }
}

/**
 * Thrown by repository **write** methods when there is no real Supabase session
 * (e.g. fallback guest mode, where `auth.uid()` is null). Callers treat this as a
 * benign "cloud unavailable, keep local" signal rather than a DB failure so we
 * never hit RLS and never spam RLS-violation errors for unauthenticated users.
 */
export class NotAuthenticatedError extends Error {
  constructor(message = 'No authenticated Supabase session; cloud write skipped.') {
    super(message);
    this.name = 'NotAuthenticatedError';
    Object.setPrototypeOf(this, NotAuthenticatedError.prototype);
  }
}

/** Normalize an unknown thrown value into a `RepositoryError`. */
export function toRepositoryError(error: unknown, context: string): RepositoryError {
  if (error && typeof error === 'object' && 'message' in error) {
    const e = error as {
      message?: string;
      code?: string;
      details?: unknown;
      hint?: string;
    };
    return new RepositoryError(`${context}: ${e.message ?? 'Unknown database error'}`, {
      code: e.code,
      details: e.details,
      hint: e.hint,
    });
  }
  return new RepositoryError(
    `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
  );
}

/**
 * Generic base class. Concrete repositories pass their table name so the
 * typed client is always in scope, and reuse the shared helpers.
 */
export class BaseRepository<TTable extends TableName> {
  protected readonly client: SupabaseClient<Database>;
  protected readonly table: TTable;

  constructor(table: TTable, client: SupabaseClient<Database> = supabase) {
    this.table = table;
    this.client = client;
  }

  /**
   * Return true when there is a real Supabase session (signed-in *or* working
   * anonymous auth). Fallback local guests have no session and return false.
   */
  protected async isAuthenticated(): Promise<boolean> {
    const { data, error } = await this.client.auth.getUser();
    return !error && !!data.user;
  }

  /**
   * Like `getCurrentUserId()` but for **write** paths: throws
   * `NotAuthenticatedError` when there is no real session instead of stamping
   * the GUEST_UID sentinel (which would fail RLS `user_id = auth.uid()`).
   */
  protected async requireUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      throw new NotAuthenticatedError();
    }
    return data.user.id;
  }

  /**
   * Return the id of the currently authenticated user, or the sentinel
   * GUEST_UID when there is no active session. This avoids PostgREST UUID
   * parse errors when callers pass the result to `.eq('user_id', ...)`.
   * Reads should use this; writes should use `requireUserId()`.
   */
  protected async getCurrentUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      return GUEST_UID;
    }
    return data.user.id;
  }
}
