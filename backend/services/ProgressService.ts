/**
 * ProgressService — application boundary for `progress`.
 *
 * Thin facade over ProgressRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → ProgressService → ProgressRepository → Supabase
 */

import { progressRepository } from '../repositories/ProgressRepository';
import type { ProgressInput, ProgressPatch } from '../repositories/ProgressRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type ProgressRow = Database['public']['Tables']['progress']['Row'];

class ProgressService {
  list(): Promise<ProgressRow[]> {
    return progressRepository.list();
  }

  get(id: string): Promise<ProgressRow | null> {
    return progressRepository.get(id);
  }

  create(input: ProgressInput): Promise<ProgressRow> {
    return progressRepository.create(input);
  }

  update(id: string, patch: ProgressPatch): Promise<ProgressRow> {
    return progressRepository.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return progressRepository.remove(id);
  }
}

export type { ProgressRow };
export const progressService = new ProgressService();
export { RepositoryError };
export default progressService;
