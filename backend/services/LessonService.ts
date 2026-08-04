/**
 * LessonService — application boundary for `lessons`.
 *
 * Thin facade over LessonRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → LessonService → LessonRepository → Supabase
 */

import { lessonRepository } from '../repositories/LessonRepository';
import type { LessonInput, LessonPatch } from '../repositories/LessonRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type LessonRow = Database['public']['Tables']['lessons']['Row'];

class LessonService {
  listByProgram(programId: string): Promise<LessonRow[]> {
    return lessonRepository.listByProgram(programId);
  }

  get(id: string): Promise<LessonRow | null> {
    return lessonRepository.get(id);
  }

  create(input: LessonInput): Promise<LessonRow> {
    return lessonRepository.create(input);
  }

  update(id: string, patch: LessonPatch): Promise<LessonRow> {
    return lessonRepository.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return lessonRepository.remove(id);
  }
}

export type { LessonRow };
export const lessonService = new LessonService();
export { RepositoryError };
export default lessonService;
