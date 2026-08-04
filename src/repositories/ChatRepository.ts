import { chatMessageRepository } from '../../backend/repositories/ChatMessageRepository';
import type { ChatMessage as FirestoreChatMessage } from '@/shared/types';
import type { Message } from '@/features/chat/types';

function chatRowToMessage(row: {
  content: string;
  is_user: boolean;
  created_at: string;
  id: string;
  reasoning: string | null;
  conversation_id: string | null;
}): FirestoreChatMessage {
  return {
    id: row.id,
    content: row.content,
    isUser: row.is_user,
    timestamp: new Date(row.created_at),
    reasoning: row.reasoning ?? undefined,
    conversationId: row.conversation_id ?? null,
  };
}

export class ChatRepository {
  async loadChatHistory(uid: string): Promise<FirestoreChatMessage[]> {
    if (!uid) return [];
    try {
      const rows = await chatMessageRepository.listByUser();
      return rows.map(chatRowToMessage);
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  async saveMessage(uid: string, message: FirestoreChatMessage): Promise<boolean> {
    if (!uid) return false;
    try {
      await chatMessageRepository.create({
        content: message.content,
        is_user: message.isUser,
        reasoning: message.reasoning ?? null,
        conversation_id: null,
      });
      return true;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
  }

  async saveMessages(uid: string, messages: Message[], conversationId: string): Promise<boolean> {
    if (!uid) return false;
    try {
      const inserts = messages
        .filter((msg) => msg.status === 'complete')
        .map((msg) =>
          chatMessageRepository.create({
            content: msg.content,
            is_user: msg.role === 'user',
            conversation_id: conversationId,
            reasoning: null,
          }),
        );
      await Promise.all(inserts);
      return true;
    } catch (error) {
      console.error('Error saving chat messages:', error);
      return false;
    }
  }

  async loadConversationMessages(uid: string, conversationId: string): Promise<Message[]> {
    if (!uid) return [];
    try {
      const rows = await chatMessageRepository.listByConversation(conversationId);
      return rows.map((row) => ({
        id: row.id,
        role: row.is_user ? 'user' as const : 'assistant' as const,
        type: 'markdown' as const,
        content: row.content,
        createdAt: new Date(row.created_at),
        status: 'complete' as const,
      }));
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      return [];
    }
  }

  async loadLatestConversationId(uid: string): Promise<string | null> {
    if (!uid) return null;
    try {
      return await chatMessageRepository.getLatestConversationId();
    } catch (error) {
      console.error('Error loading latest conversation:', error);
      return null;
    }
  }
}

export const chatRepository = new ChatRepository();
export default chatRepository;
