/**
 * Session Repository
 *
 * Tracks practice/exercise sessions (`sessions`). `start` stamps `user_id`,
 * `complete` closes the session with an optional duration + end time.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export type SessionInput = Omit<SessionInsert, 'user_id' | 'id' | 'created_at' | 'status'>;
export type SessionPatch = Partial<Omit<SessionUpdate, 'user_id' | 'id' | 'created_at'>>;

export class SessionRepository extends BaseRepository<'sessions'> {
  constructor() {
    super('sessions');
  }

  async list(): Promise<SessionRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('user_id', uid)
      .order('started_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'SessionRepository.list');
    return data ?? [];
  }

  async get(id: string): Promise<SessionRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'SessionRepository.get');
    return data;
  }

  async start(input: SessionInput): Promise<SessionRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('sessions')
      .insert({ ...input, user_id: uid, status: 'active' })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'SessionRepository.start');
    if (!data) throw new Error('SessionRepository.start: no row returned.');
    return data;
  }

  async complete(id: string, patch: SessionPatch = {}): Promise<SessionRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        ...patch,
      })
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'SessionRepository.complete');
    if (!data) throw new Error('SessionRepository.complete: no row returned.');
    return data;
  }

  async cancel(id: string): Promise<SessionRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('sessions')
      .update({
        status: 'abandoned',
        ended_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'SessionRepository.cancel');
    if (!data) throw new Error('SessionRepository.cancel: no row returned.');
    return data;
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
