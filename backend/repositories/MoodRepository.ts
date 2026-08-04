/**
 * Mood Repository
 *
 * CRUD + domain methods for `moods`. `recorded_at` defaults to now() server-side
 * but callers may pass it; `user_id` is stamped on insert.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type MoodRow = Database['public']['Tables']['moods']['Row'];
type MoodInsert = Database['public']['Tables']['moods']['Insert'];
type MoodUpdate = Database['public']['Tables']['moods']['Update'];

export type MoodInput = Omit<MoodInsert, 'user_id' | 'id' | 'created_at'>;
export type MoodPatch = Partial<Omit<MoodUpdate, 'user_id' | 'id' | 'created_at'>>;

export class MoodRepository extends BaseRepository<'moods'> {
  constructor() {
    super('moods');
  }

  async list(limit?: number): Promise<MoodRow[]> {
    const uid = await this.getCurrentUserId();
    let query = this.client
      .from('moods')
      .select('*')
      .eq('user_id', uid)
      .order('recorded_at', { ascending: false });
    if (limit && limit > 0) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, 'MoodRepository.list');
    return data ?? [];
  }

  async get(id: string): Promise<MoodRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('moods')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'MoodRepository.get');
    return data;
  }

  async create(input: MoodInput): Promise<MoodRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('moods')
      .insert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'MoodRepository.create');
    if (!data) throw new Error('MoodRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: MoodPatch): Promise<MoodRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('moods')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'MoodRepository.update');
    if (!data) throw new Error('MoodRepository.update: no row returned.');
    return data;
  }

  async remove(id: string): Promise<void> {
    const uid = await this.requireUserId();
    const { error } = await this.client
      .from('moods')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw toRepositoryError(error, 'MoodRepository.remove');
  }

  /** Moods recorded within the last `days` days (inclusive of today). */
  async recent(days: number): Promise<MoodRow[]> {
    const uid = await this.getCurrentUserId();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.client
      .from('moods')
      .select('*')
      .eq('user_id', uid)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'MoodRepository.recent');
    return data ?? [];
  }
}

export const moodRepository = new MoodRepository();
export default moodRepository;
