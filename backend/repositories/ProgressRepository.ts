/**
 * Progress Repository
 *
 * Per-user progress on journeys/programs/lessons/exercises. `user_id` is stamped
 * on insert and filtered on read (RLS enforces ownership).
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type ProgressRow = Database['public']['Tables']['progress']['Row'];
type ProgressInsert = Database['public']['Tables']['progress']['Insert'];
type ProgressUpdate = Database['public']['Tables']['progress']['Update'];

export type ProgressInput = Omit<ProgressInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>;
export type ProgressPatch = Partial<Omit<ProgressUpdate, 'user_id' | 'id' | 'created_at' | 'updated_at'>>;

export class ProgressRepository extends BaseRepository<'progress'> {
  constructor() {
    super('progress');
  }

  async list(): Promise<ProgressRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('progress')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'ProgressRepository.list');
    return data ?? [];
  }

  async get(id: string): Promise<ProgressRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('progress')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ProgressRepository.get');
    return data;
  }

  async create(input: ProgressInput): Promise<ProgressRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('progress')
      .insert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ProgressRepository.create');
    if (!data) throw new Error('ProgressRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: ProgressPatch): Promise<ProgressRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('progress')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ProgressRepository.update');
    if (!data) throw new Error('ProgressRepository.update: no row returned.');
    return data;
  }

  async remove(id: string): Promise<void> {
    const uid = await this.requireUserId();
    const { error } = await this.client
      .from('progress')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw toRepositoryError(error, 'ProgressRepository.remove');
  }
}

export const progressRepository = new ProgressRepository();
export default progressRepository;
