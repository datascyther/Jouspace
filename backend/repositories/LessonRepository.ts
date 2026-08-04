/**
 * Lesson Repository
 *
 * `lessons` are owned transitively through program -> journey. The table has no
 * `user_id`; writes are scoped by `program_id` and rely on RLS for auth.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type LessonRow = Database['public']['Tables']['lessons']['Row'];
type LessonUpdate = Database['public']['Tables']['lessons']['Update'];
type LessonInsert = Database['public']['Tables']['lessons']['Insert'];

export type LessonInput = Omit<LessonInsert, 'id' | 'created_at' | 'updated_at'>;
export type LessonPatch = Partial<Omit<LessonUpdate, 'id' | 'created_at' | 'updated_at'>>;

export class LessonRepository extends BaseRepository<'lessons'> {
  constructor() {
    super('lessons');
  }

  async listByProgram(programId: string): Promise<LessonRow[]> {
    const { data, error } = await this.client
      .from('lessons')
      .select('*')
      .eq('program_id', programId)
      .order('position', { ascending: true });
    if (error) throw toRepositoryError(error, 'LessonRepository.listByProgram');
    return data ?? [];
  }

  async get(id: string): Promise<LessonRow | null> {
    const { data, error } = await this.client
      .from('lessons')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'LessonRepository.get');
    return data;
  }

  async create(input: LessonInput): Promise<LessonRow> {
    const { data, error } = await this.client
      .from('lessons')
      .insert(input)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'LessonRepository.create');
    if (!data) throw new Error('LessonRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: LessonPatch): Promise<LessonRow> {
    const { data, error } = await this.client
      .from('lessons')
      .update(patch as LessonUpdate)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'LessonRepository.update');
    if (!data) throw new Error('LessonRepository.update: no row returned.');
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('lessons').delete().eq('id', id);
    if (error) throw toRepositoryError(error, 'LessonRepository.remove');
  }
}

export const lessonRepository = new LessonRepository();
export default lessonRepository;
