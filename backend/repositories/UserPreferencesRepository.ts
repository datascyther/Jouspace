/**
 * User Preferences Repository
 *
 * Per-user app preferences (`user_preferences`). One row per user (`user_id` is
 * unique). `user_id` is stamped on insert and filtered on read (RLS enforced).
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type PreferencesRow = Database['public']['Tables']['user_preferences']['Row'];
type PreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
type PreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

export type PreferencesInput = Omit<
  PreferencesInsert,
  'user_id' | 'id' | 'created_at' | 'updated_at'
>;
export type PreferencesPatch = Partial<
  Omit<PreferencesUpdate, 'user_id' | 'id' | 'created_at' | 'updated_at'>
>;

export class UserPreferencesRepository extends BaseRepository<'user_preferences'> {
  constructor() {
    super('user_preferences');
  }

  async get(): Promise<PreferencesRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('user_preferences')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'UserPreferencesRepository.get');
    return data;
  }

  /** Insert preferences, or update the existing row (unique `user_id`). */
  async upsert(input: PreferencesInput): Promise<PreferencesRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('user_preferences')
      .upsert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'UserPreferencesRepository.upsert');
    if (!data) throw new Error('UserPreferencesRepository.upsert: no row returned.');
    return data;
  }

  async update(patch: PreferencesPatch): Promise<PreferencesRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('user_preferences')
      .update(patch)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'UserPreferencesRepository.update');
    if (!data) throw new Error('UserPreferencesRepository.update: no row returned.');
    return data;
  }
}

export const userPreferencesRepository = new UserPreferencesRepository();
export default userPreferencesRepository;
