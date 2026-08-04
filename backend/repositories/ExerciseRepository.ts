/**
 * Exercise Repository
 *
 * `exercises` is a shared, read-only CONTENT library. Authenticated users may
 * SELECT (RLS `exercises_select`); writes require the service-role key and are
 * intentionally NOT exposed here. No `user_id` column exists on this table.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];
type ExerciseType = Database['public']['Enums']['exercise_type'];

export class ExerciseRepository extends BaseRepository<'exercises'> {
  constructor() {
    super('exercises');
  }

  /** List all exercises, optionally filtered by type. */
  async list(type?: ExerciseType): Promise<ExerciseRow[]> {
    let query = this.client
      .from('exercises')
      .select('*')
      .order('position', { ascending: true });
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, 'ExerciseRepository.list');
    return data ?? [];
  }

  /** List exercises belonging to a lesson. */
  async listByLesson(lessonId: string): Promise<ExerciseRow[]> {
    const { data, error } = await this.client
      .from('exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('position', { ascending: true });
    if (error) throw toRepositoryError(error, 'ExerciseRepository.listByLesson');
    return data ?? [];
  }

  async get(id: string): Promise<ExerciseRow | null> {
    const { data, error } = await this.client
      .from('exercises')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ExerciseRepository.get');
    return data;
  }
}

export const exerciseRepository = new ExerciseRepository();
export default exerciseRepository;
