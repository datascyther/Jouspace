import { conversationMessageRepository } from '../../backend/repositories/ConversationMessageRepository';
import { conversationRepository } from './ConversationRepository';
import type { ConversationMessage } from '@/shared/types';

export const MESSAGES_PAGE_SIZE = 50;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function mapRowToConvMessage(row: {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  type: string;
  reply_to: string | null;
  read_by: any;
}): ConversationMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    timestamp: new Date(row.created_at),
    type: row.type as ConversationMessage['type'],
    replyTo: row.reply_to ?? undefined,
    readBy: (row.read_by as string[]) ?? [],
  };
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type?: 'text' | 'system';
  replyTo?: string;
}

export class MessageRepository {
  async sendMessage(data: SendMessageData): Promise<ConversationMessage> {
    const messageId = generateId();
    const now = new Date();

    const row = await conversationMessageRepository.create({
      id: messageId,
      conversation_id: data.conversationId,
      sender_id: data.senderId,
      sender_name: data.senderName,
      content: data.content,
      type: data.type ?? 'text',
      reply_to: data.replyTo ?? null,
      read_by: [data.senderId],
    });

    await conversationRepository.updateLastMessage(data.conversationId, {
      content: data.content,
      senderId: data.senderId,
      senderName: data.senderName,
      timestamp: now,
    });

    return mapRowToConvMessage(row);
  }

  async sendSystemMessage(
    conversationId: string,
    content: string,
  ): Promise<ConversationMessage> {
    return this.sendMessage({
      conversationId,
      senderId: 'system',
      senderName: 'System',
      content,
      type: 'system',
    });
  }

  async getMessages(
    conversationId: string,
    pageSize: number = MESSAGES_PAGE_SIZE,
    cursor?: ConversationMessage,
  ): Promise<ConversationMessage[]> {
    const rows = await conversationMessageRepository.listByConversation(
      conversationId,
      pageSize,
      cursor?.id,
    );
    return rows.map(mapRowToConvMessage);
  }

  async markAsRead(
    conversationId: string,
    messageId: string,
    uid: string,
  ): Promise<void> {
    try {
      await conversationMessageRepository.markAsRead(messageId, uid);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }
}

export const messageRepository = new MessageRepository();
export default messageRepository;
