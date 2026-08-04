/**
 * Notification Repository
 *
 * Per-user notifications. `user_id` is stamped on insert and filtered on read
 * (RLS enforces ownership). `markRead`/`markAllRead` are domain helpers.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type NotificationInput = Omit<
  NotificationInsert,
  'user_id' | 'id' | 'read' | 'created_at'
>;
export type NotificationPatch = Partial<
  Omit<NotificationUpdate, 'user_id' | 'id' | 'created_at'>
>;

export class NotificationRepository extends BaseRepository<'notifications'> {
  constructor() {
    super('notifications');
  }

  async list(unreadOnly = false): Promise<NotificationRow[]> {
    const uid = await this.getCurrentUserId();
    let query = this.client
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (unreadOnly) query = query.eq('read', false);
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, 'NotificationRepository.list');
    return data ?? [];
  }

  async get(id: string): Promise<NotificationRow | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'NotificationRepository.get');
    return data;
  }

  async create(input: NotificationInput): Promise<NotificationRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('notifications')
      .insert({ ...input, user_id: uid, read: false })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'NotificationRepository.create');
    if (!data) throw new Error('NotificationRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: NotificationPatch): Promise<NotificationRow> {
    const uid = await this.requireUserId();
    const { data, error } = await this.client
      .from('notifications')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'NotificationRepository.update');
    if (!data) throw new Error('NotificationRepository.update: no row returned.');
    return data;
  }

  async markRead(id: string): Promise<NotificationRow> {
    return this.update(id, { read: true });
  }

  async markAllRead(): Promise<void> {
    const uid = await this.requireUserId();
    const { error } = await this.client
      .from('notifications')
      .update({ read: true })
      .eq('user_id', uid)
      .eq('read', false);
    if (error) throw toRepositoryError(error, 'NotificationRepository.markAllRead');
  }

  async remove(id: string): Promise<void> {
    const uid = await this.requireUserId();
    const { error } = await this.client
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw toRepositoryError(error, 'NotificationRepository.remove');
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
