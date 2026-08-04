/**
 * ExerciseService — application boundary for the `exercises` content library.
 *
 * Thin facade over ExerciseRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → ExerciseService → ExerciseRepository → Supabase
 *
 * `exercises` is a shared, read-only content library; the repository intentionally
 * exposes no writes.
 */

import { exerciseRepository } from '../repositories/ExerciseRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];
type ExerciseType = Database['public']['Enums']['exercise_type'];

class ExerciseService {
  list(type?: ExerciseType): Promise<ExerciseRow[]> {
    return exerciseRepository.list(type);
  }

  listByLesson(lessonId: string): Promise<ExerciseRow[]> {
    return exerciseRepository.listByLesson(lessonId);
  }

  get(id: string): Promise<ExerciseRow | null> {
    return exerciseRepository.get(id);
  }
}

export type { ExerciseRow };
export const exerciseService = new ExerciseService();
export { RepositoryError };
export default exerciseService;
