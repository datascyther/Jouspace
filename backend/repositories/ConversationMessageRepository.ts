import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type ConvMessageRow = Database['public']['Tables']['conversation_messages']['Row'];
type ConvMessageInsert = Database['public']['Tables']['conversation_messages']['Insert'];
type ConvMessageUpdate = Database['public']['Tables']['conversation_messages']['Update'];

export type ConvMessageInput = Omit<ConvMessageInsert, 'id' | 'created_at'> & {
  id?: string;
};
export type ConvMessagePatch = Partial<
  Omit<ConvMessageUpdate, 'id' | 'created_at' | 'conversation_id'>
>;

export const MESSAGES_PAGE_SIZE = 50;

export class ConversationMessageRepository extends BaseRepository<'conversation_messages'> {
  constructor() {
    super('conversation_messages');
  }

  async get(conversationId: string, messageId: string): Promise<ConvMessageRow | null> {
    const { data, error } = await this.client
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('id', messageId)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ConversationMessageRepository.get');
    return data;
  }

  async listByConversation(
    conversationId: string,
    pageSize: number = MESSAGES_PAGE_SIZE,
    cursor?: string,
  ): Promise<ConvMessageRow[]> {
    let query = this.client
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (cursor) {
      const cursorMsg = await this.get(conversationId, cursor);
      if (cursorMsg) {
        query = query.lt('created_at', cursorMsg.created_at);
      }
    }

    const { data, error } = await query;
    if (error) throw toRepositoryError(error, 'ConversationMessageRepository.listByConversation');
    return data ?? [];
  }

  async create(input: ConvMessageInput): Promise<ConvMessageRow> {
    const { data, error } = await this.client
      .from('conversation_messages')
      .insert(input)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ConversationMessageRepository.create');
    if (!data) throw new Error('ConversationMessageRepository.create: no row returned.');
    return data;
  }

  async update(messageId: string, patch: ConvMessagePatch): Promise<ConvMessageRow> {
    const { data, error } = await this.client
      .from('conversation_messages')
      .update(patch)
      .eq('id', messageId)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ConversationMessageRepository.update');
    if (!data) throw new Error('ConversationMessageRepository.update: no row returned.');
    return data;
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const msg = await this.client
      .from('conversation_messages')
      .select('read_by')
      .eq('id', messageId)
      .maybeSingle();
    if (msg.error) throw toRepositoryError(msg.error, 'ConversationMessageRepository.markAsRead');
    if (!msg.data) return;

    const currentReadBy: string[] = msg.data.read_by as string[] ?? [];
    if (currentReadBy.includes(userId)) return;

    await this.update(messageId, {
      read_by: [...currentReadBy, userId],
    });
  }
}

export const conversationMessageRepository = new ConversationMessageRepository();
export default conversationMessageRepository;
