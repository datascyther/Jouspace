import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export type ChatMessageInput = Omit<ChatMessageInsert, 'user_id' | 'id' | 'created_at'>;

export class ChatMessageRepository extends BaseRepository<'chat_messages'> {
  constructor() {
    super('chat_messages');
  }

  async listByUser(): Promise<ChatMessageRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('chat_messages')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });
    if (error) throw toRepositoryError(error, 'ChatMessageRepository.listByUser');
    return data ?? [];
  }

  async listByConversation(conversationId: string): Promise<ChatMessageRow[]> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('chat_messages')
      .select('*')
      .eq('user_id', uid)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw toRepositoryError(error, 'ChatMessageRepository.listByConversation');
    return data ?? [];
  }

  async create(input: ChatMessageInput): Promise<ChatMessageRow> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('chat_messages')
      .insert({ ...input, user_id: uid })
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ChatMessageRepository.create');
    if (!data) throw new Error('ChatMessageRepository.create: no row returned.');
    return data;
  }

  async getLatestConversationId(): Promise<string | null> {
    const uid = await this.getCurrentUserId();
    const { data, error } = await this.client
      .from('chat_messages')
      .select('conversation_id')
      .eq('user_id', uid)
      .not('conversation_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ChatMessageRepository.getLatestConversationId');
    return data?.conversation_id ?? null;
  }
}

export const chatMessageRepository = new ChatMessageRepository();
export default chatMessageRepository;
