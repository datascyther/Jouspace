/**
 * Journal Repository
 *
 * Per-user journal entries. `user_id` is stamped on insert and filtered on read
 * (RLS enforces ownership).
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type JournalRow = Database['public']['Tables']['journal_entries']['Row'];
type JournalInsert = Database['public']['Tables']['journal_entries']['Insert'];
type JournalUpdate = Database['public']['Tables']['journal_entries']['Update'];

export type JournalInput = Omit<JournalInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>;
export type JournalPatch = Partial<
  Omit<JournalUpdate, 'user_id' | 'id' | 'created_at' | 'updated_at'>
>;

export class JournalRepository extends BaseRepository<'journal_entries'> {
  constructor() {
    super('journal_entries');
  }

  async list(): Promise<JournalRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('journal_entries')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'JournalRepository.list');
    return data ?? [];
  }

  async get(id: string): Promise<JournalRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'JournalRepository.get');
    return data;
  }

  async create(input: JournalInput): Promise<JournalRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('journal_entries')
      .insert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'JournalRepository.create');
    if (!data) throw new Error('JournalRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: JournalPatch): Promise<JournalRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('journal_entries')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'JournalRepository.update');
    if (!data) throw new Error('JournalRepository.update: no row returned.');
    return data;
  }

  async remove(id: string): Promise<void> {
    const uid = await this.requireUserId();
    const { error } = await this.client
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw toRepositoryError(error, 'JournalRepository.remove');
  }
}

export const journalRepository = new JournalRepository();
export default journalRepository;
