/**
 * Recommendation Repository
 *
 * CRUD + state transitions for `recommendations`. `accept`/`dismiss`/`complete`
 * are domain helpers that move the row through its status enum.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type RecommendationRow = Database['public']['Tables']['recommendations']['Row'];
type RecommendationInsert = Database['public']['Tables']['recommendations']['Insert'];
type RecommendationUpdate = Database['public']['Tables']['recommendations']['Update'];

type RecommendationStatus = Database['public']['Enums']['recommendation_status'];

export type RecommendationInput = Omit<
  RecommendationInsert,
  'user_id' | 'id' | 'created_at' | 'updated_at' | 'status'
>;
export type RecommendationPatch = Partial<
  Omit<RecommendationUpdate, 'user_id' | 'id' | 'created_at' | 'updated_at'>
>;

export class RecommendationRepository extends BaseRepository<'recommendations'> {
  constructor() {
    super('recommendations');
  }

  async list(status?: RecommendationStatus): Promise<RecommendationRow[]> {
    const uid = await this.getCurrentUserId();
    let query = this.client
      .from('recommendations')
      .select('*')
      .eq('user_id', uid)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, 'RecommendationRepository.list');
    return data ?? [];
  }

  async get(id: string): Promise<RecommendationRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('recommendations')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'RecommendationRepository.get');
    return data;
  }

  async create(input: RecommendationInput): Promise<RecommendationRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('recommendations')
      .insert({ ...input, user_id: uid, status: 'pending' })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'RecommendationRepository.create');
    if (!data) throw new Error('RecommendationRepository.create: no row returned.');
    return data;
  }

  async accept(id: string, patch: RecommendationPatch = {}): Promise<RecommendationRow> {
    return this.setStatus(id, 'accepted', patch);
  }

  async dismiss(id: string, patch: RecommendationPatch = {}): Promise<RecommendationRow> {
    return this.setStatus(id, 'dismissed', patch);
  }

  async complete(id: string, patch: RecommendationPatch = {}): Promise<RecommendationRow> {
    return this.setStatus(id, 'completed', patch);
  }

  private async setStatus(
    id: string,
    status: RecommendationStatus,
    patch: RecommendationPatch,
  ): Promise<RecommendationRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('recommendations')
      .update({ status, ...patch })
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, `RecommendationRepository.${status}`);
    if (!data) throw new Error(`RecommendationRepository.${status}: no row returned.`);
    return data;
  }
}

export const recommendationRepository = new RecommendationRepository();
export default recommendationRepository;
