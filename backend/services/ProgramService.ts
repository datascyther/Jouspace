/**
 * ProgramService — application boundary for `programs`.
 *
 * Thin facade over ProgramRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → ProgramService → ProgramRepository → Supabase
 */

import { programRepository } from '../repositories/ProgramRepository';
import type { ProgramInput, ProgramPatch } from '../repositories/ProgramRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type ProgramRow = Database['public']['Tables']['programs']['Row'];

class ProgramService {
  listByJourney(journeyId: string): Promise<ProgramRow[]> {
    return programRepository.listByJourney(journeyId);
  }

  get(id: string): Promise<ProgramRow | null> {
    return programRepository.get(id);
  }

  create(input: ProgramInput): Promise<ProgramRow> {
    return programRepository.create(input);
  }

  update(id: string, patch: ProgramPatch): Promise<ProgramRow> {
    return programRepository.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return programRepository.remove(id);
  }
}

export type { ProgramRow };
export const programService = new ProgramService();
export { RepositoryError };
export default programService;
