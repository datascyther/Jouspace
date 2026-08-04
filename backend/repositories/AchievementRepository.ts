/**
 * Achievement Repository
 *
 * Per-user earned achievements. `user_id` is stamped on insert and filtered on
 * read (RLS enforces ownership).
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type AchievementRow = Database['public']['Tables']['achievements']['Row'];
type AchievementInsert = Database['public']['Tables']['achievements']['Insert'];
type AchievementUpdate = Database['public']['Tables']['achievements']['Update'];

type AchievementType = Database['public']['Enums']['achievement_type'];

export type AchievementInput = Omit<
  AchievementInsert,
  'user_id' | 'id' | 'created_at' | 'earned_at'
>;
export type AchievementPatch = Partial<
  Omit<AchievementUpdate, 'user_id' | 'id' | 'created_at' | 'earned_at'>
>;

export class AchievementRepository extends BaseRepository<'achievements'> {
  constructor() {
    super('achievements');
  }

  async list(): Promise<AchievementRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('achievements')
      .select('*')
      .eq('user_id', uid)
      .order('earned_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'AchievementRepository.list');
    return data ?? [];
  }

  async listByType(type: AchievementType): Promise<AchievementRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('achievements')
      .select('*')
      .eq('user_id', uid)
      .eq('type', type)
      .order('earned_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'AchievementRepository.listByType');
    return data ?? [];
  }

  async get(id: string): Promise<AchievementRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('achievements')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'AchievementRepository.get');
    return data;
  }

  async create(input: AchievementInput): Promise<AchievementRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('achievements')
      .insert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'AchievementRepository.create');
    if (!data) throw new Error('AchievementRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: AchievementPatch): Promise<AchievementRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('achievements')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'AchievementRepository.update');
    if (!data) throw new Error('AchievementRepository.update: no row returned.');
    return data;
  }

  async remove(id: string): Promise<void> {
    const uid = await this.requireUserId();
    const { error } = await this.client
      .from('achievements')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw toRepositoryError(error, 'AchievementRepository.remove');
  }
}

export const achievementRepository = new AchievementRepository();
export default achievementRepository;
