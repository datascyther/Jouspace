import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type UserConvRow = Database['public']['Tables']['user_conversations']['Row'];
type UserConvInsert = Database['public']['Tables']['user_conversations']['Insert'];
type UserConvUpdate = Database['public']['Tables']['user_conversations']['Update'];

export type UserConvInput = UserConvInsert;
export type UserConvPatch = Partial<
  Omit<UserConvUpdate, 'conversation_id' | 'user_id'>
>;

export class UserConversationRepository extends BaseRepository<'user_conversations'> {
  constructor() {
    super('user_conversations');
  }

  async listByUser(): Promise<UserConvRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('user_conversations')
      .select('*')
      .eq('user_id', uid)
      .order('last_message_at', { ascending: false });
    if (error) throw toRepositoryError(error, 'UserConversationRepository.listByUser');
    return data ?? [];
  }

  async get(userId: string, conversationId: string): Promise<UserConvRow | null> {
    const { data, error } = await this.client
      .from('user_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'UserConversationRepository.get');
    return data;
  }

  async create(input: UserConvInput): Promise<UserConvRow> {
    const { data, error } = await this.client
      .from('user_conversations')
      .insert(input)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'UserConversationRepository.create');
    if (!data) throw new Error('UserConversationRepository.create: no row returned.');
    return data;
  }

  async update(userId: string, conversationId: string, patch: UserConvPatch): Promise<UserConvRow> {
    const { data, error } = await this.client
      .from('user_conversations')
      .update(patch)
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'UserConversationRepository.update');
    if (!data) throw new Error('UserConversationRepository.update: no row returned.');
    return data;
  }

  async remove(userId: string, conversationId: string): Promise<void> {
    const { error } = await this.client
      .from('user_conversations')
      .delete()
      .eq('user_id', userId)
      .eq('conversation_id', conversationId);
    if (error) throw toRepositoryError(error, 'UserConversationRepository.remove');
  }
}

export const userConversationRepository = new UserConversationRepository();
export default userConversationRepository;
