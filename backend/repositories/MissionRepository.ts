/**
 * Mission Repository
 *
 * Per-user "Today's Mission" rows (one per `assigned_for_date`). `user_id` is
 * stamped on insert and filtered on every read (RLS enforces ownership).
 * `getToday` fetches the mission for a given date (defaults to today);
 * `complete` is a domain helper that stamps status + completed_at.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type MissionRow = Database['public']['Tables']['missions']['Row'];
type MissionInsert = Database['public']['Tables']['missions']['Insert'];
type MissionUpdate = Database['public']['Tables']['missions']['Update'];

export type MissionInput = Omit<
  MissionInsert,
  'user_id' | 'id' | 'created_at' | 'updated_at'
>;
export type MissionPatch = Partial<
  Omit<MissionUpdate, 'user_id' | 'id' | 'created_at'>
>;

export class MissionRepository extends BaseRepository<'missions'> {
  constructor() {
    super('missions');
  }

  /** The mission assigned for `date` (defaults to today), or null. */
  async getToday(date: string = new Date().toISOString().slice(0, 10)): Promise<MissionRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('missions')
      .select('*')
      .eq('user_id', uid)
      .eq('assigned_for_date', date)
      .order('created_at', { ascending: false })
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'MissionRepository.getToday');
    return data;
  }

  async list(): Promise<MissionRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('missions')
      .select('*')
      .eq('user_id', uid)
      .order('assigned_for_date', { ascending: false });
    if (error) throw toRepositoryError(error, 'MissionRepository.list');
    return data ?? [];
  }

  async get(id: string): Promise<MissionRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('missions')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'MissionRepository.get');
    return data;
  }

  async create(input: MissionInput): Promise<MissionRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('missions')
      .insert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'MissionRepository.create');
    if (!data) throw new Error('MissionRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: MissionPatch): Promise<MissionRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('missions')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'MissionRepository.update');
    if (!data) throw new Error('MissionRepository.update: no row returned.');
    return data;
  }

  /** Mark a mission completed (status + completed_at). */
  async complete(id: string): Promise<MissionRow> {
    return this.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  async remove(id: string): Promise<void> {
    const uid = await this.requireUserId();
    const { error } = await this.client
      .from('missions')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw toRepositoryError(error, 'MissionRepository.remove');
  }
}

export const missionRepository = new MissionRepository();
export default missionRepository;
