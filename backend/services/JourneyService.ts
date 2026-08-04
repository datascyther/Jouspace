/**
 * JourneyService — application boundary for `journeys`.
 *
 * Thin facade over JourneyRepository. The ViewModel/UI must talk to this
 * service (never to the repository or Supabase directly), matching how
 * `AuthService` already works:
 *
 *    UI / ViewModel → JourneyService → JourneyRepository → Supabase
 */

import { journeyRepository } from '../repositories/JourneyRepository';
import type { JourneyInput, JourneyPatch } from '../repositories/JourneyRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type JourneyRow = Database['public']['Tables']['journeys']['Row'];
type JourneyStatus = Database['public']['Enums']['journey_status'];

export type { JourneyRow, JourneyStatus };

class JourneyService {
  // ── Reads ──────────────────────────────────────────────────────────────────
  list(): Promise<JourneyRow[]> {
    return journeyRepository.list();
  }

  get(id: string): Promise<JourneyRow | null> {
    return journeyRepository.get(id);
  }

  listByStatus(status: JourneyStatus): Promise<JourneyRow[]> {
    return journeyRepository.listByStatus(status);
  }

  // ── Writes ──────────────────────────────────────────────────────────────────
  create(input: JourneyInput): Promise<JourneyRow> {
    return journeyRepository.create(input);
  }

  update(id: string, patch: JourneyPatch): Promise<JourneyRow> {
    return journeyRepository.update(id, patch);
  }

  /** Link the active program to a journey. */
  setCurrentProgram(journeyId: string, programId: string): Promise<JourneyRow> {
    return journeyRepository.setCurrentProgram(journeyId, programId);
  }

  remove(id: string): Promise<void> {
    return journeyRepository.remove(id);
  }
}

export const journeyService = new JourneyService();
export { RepositoryError };
export default journeyService;
