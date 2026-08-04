/**
 * Analytics Repository
 *
 * Append-only telemetry. `analytics_events.user_id` is nullable (anonymous-safe)
 * so inserts may omit it — we deliberately do NOT force-stamp `user_id` here,
 * unlike the other user-owned tables. SELECT is scoped to the caller's own
 * events (RLS `analytics_events_select` => `user_id = auth.uid()`).
 */

import { BaseRepository, toRepositoryError, GUEST_UID } from './baseRepository';
import type { Database } from '../database.types';

type AnalyticsRow = Database['public']['Tables']['analytics_events']['Row'];
type AnalyticsInsert = Database['public']['Tables']['analytics_events']['Insert'];

export type AnalyticsEventInput = Omit<AnalyticsInsert, 'id' | 'created_at'>;

export class AnalyticsRepository extends BaseRepository<'analytics_events'> {
  constructor() {
    super('analytics_events');
  }

  /** Record an event. `user_id` may be omitted for anonymous telemetry. */
  async track(input: AnalyticsEventInput): Promise<AnalyticsRow | null> {
    const uid = input.user_id || (await this.getCurrentUserId());
    if (uid === GUEST_UID) return null;
    const { data, error } = await this.client
      .from('analytics_events')
      .insert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) {
      console.warn('[Analytics] track failed (non-fatal):', error.message);
      return null;
    }
    if (!data) return null;
    return data;
  }

  /** List the current user's attributed events (anonymous events are excluded). */
  async list(limit?: number): Promise<AnalyticsRow[]> {
    const uid = await this.getCurrentUserId();
    let query = this.client
      .from('analytics_events')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (limit && limit > 0) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, 'AnalyticsRepository.list');
    return data ?? [];
  }

  async get(id: number): Promise<AnalyticsRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('analytics_events')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'AnalyticsRepository.get');
    return data;
  }
}

export const analyticsRepository = new AnalyticsRepository();
export default analyticsRepository;
