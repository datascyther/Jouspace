/**
 * SessionService — application boundary for `sessions`.
 *
 * Thin facade over SessionRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → SessionService → SessionRepository → Supabase
 */

import { sessionRepository } from '../repositories/SessionRepository';
import type { SessionInput, SessionPatch } from '../repositories/SessionRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type SessionRow = Database['public']['Tables']['sessions']['Row'];

class SessionService {
  // ── Reads ──────────────────────────────────────────────────────────────────
  list(): Promise<SessionRow[]> {
    return sessionRepository.list();
  }

  get(id: string): Promise<SessionRow | null> {
    return sessionRepository.get(id);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  start(input: SessionInput): Promise<SessionRow> {
    if (!input.program_id && !input.journey_id) {
      throw new RepositoryError(
        'SessionService.start: a session must be linked to a program_id or journey_id.',
        { code: 'VALIDATION' },
      );
    }
    return sessionRepository.start(input);
  }

  complete(id: string, patch: SessionPatch = {}): Promise<SessionRow> {
    return sessionRepository.complete(id, patch);
  }

  cancel(id: string): Promise<SessionRow> {
    return sessionRepository.cancel(id);
  }
}

export type { SessionRow };
export const sessionService = new SessionService();
export { RepositoryError };
export default sessionService;
