/**
 * Journey Repository
 *
 * CRUD + domain methods for `journeys`. Every write is stamped and filtered on
 * `user_id` (RLS enforces ownership; the filter here is defence-in-depth).
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type JourneyRow = Database['public']['Tables']['journeys']['Row'];
type JourneyInsert = Database['public']['Tables']['journeys']['Insert'];
type JourneyUpdate = Database['public']['Tables']['journeys']['Update'];

type JourneyStatus = Database['public']['Enums']['journey_status'];

export type JourneyInput = Omit<JourneyInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>;
export type JourneyPatch = Partial<
  Omit<JourneyUpdate, 'user_id' | 'id' | 'created_at' | 'updated_at'>
>;

export class JourneyRepository extends BaseRepository<'journeys'> {
  constructor() {
    super('journeys');
  }

  async list(): Promise<JourneyRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('journeys')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'JourneyRepository.list');
    return data ?? [];
  }

  async get(id: string): Promise<JourneyRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('journeys')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'JourneyRepository.get');
    return data;
  }

  async create(input: JourneyInput): Promise<JourneyRow> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('journeys')
      .insert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'JourneyRepository.create');
    if (!data) throw new Error('JourneyRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: JourneyPatch): Promise<JourneyRow> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('journeys')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'JourneyRepository.update');
    if (!data) throw new Error('JourneyRepository.update: no row returned.');
    return data;
  }

  /** Link the active program to a journey (defence-in-depth user filter). */
  async setCurrentProgram(journeyId: string, programId: string): Promise<JourneyRow> {
    return this.update(journeyId, { current_program_id: programId });
  }

  async remove(id: string): Promise<void> {
    const uid = await this.getCurrentUserId();
    const { error } = await this.client
      .from('journeys')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw toRepositoryError(error, 'JourneyRepository.remove');
  }

  async listByStatus(status: JourneyStatus): Promise<JourneyRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('journeys')
      .select('*')
      .eq('user_id', uid)
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'JourneyRepository.listByStatus');
    return data ?? [];
  }
}

export const journeyRepository = new JourneyRepository();
export default journeyRepository;
