import {
  backendConversationRepository,
  conversationParticipantRepository,
  userConversationRepository,
} from '../../backend/repositories';
import type { Conversation, ConversationParticipant, UserConversation } from '@/shared/types';

function mapRowToConversation(row: {
  id: string;
  type: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  metadata: any;
  last_message: any;
}): Conversation {
  const lastMsg = row.last_message as {
    content?: string;
    senderId?: string;
    senderName?: string;
    timestamp?: string;
  } | null;
  return {
    id: row.id,
    type: row.type as Conversation['type'],
    name: row.name,
    description: row.description ?? undefined,
    imageURL: row.image_url ?? undefined,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    participantIds: [],
    memberCount: row.member_count,
    lastMessage: lastMsg
      ? {
          content: lastMsg.content ?? '',
          senderId: lastMsg.senderId ?? '',
          senderName: lastMsg.senderName ?? '',
          timestamp: lastMsg.timestamp ? new Date(lastMsg.timestamp) : new Date(),
        }
      : undefined,
    metadata: row.metadata && typeof row.metadata === 'object' && 'isSupportGroup' in row.metadata
      ? row.metadata as Conversation['metadata']
      : undefined,
  };
}

function mapRowToUserConv(row: {
  conversation_id: string;
  last_read_at: string;
  last_message_at: string;
  last_message_preview: string;
  is_pinned: boolean;
  is_muted: boolean;
}): UserConversation {
  return {
    id: row.conversation_id,
    lastReadAt: new Date(row.last_read_at),
    lastMessageAt: new Date(row.last_message_at),
    isPinned: row.is_pinned,
    isMuted: row.is_muted,
    lastMessagePreview: row.last_message_preview,
  };
}

export interface CreateGroupData {
  name: string;
  description?: string;
  imageURL?: string;
  createdBy: string;
  participantIds: string[];
  isSupportGroup?: boolean;
  category?: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export class ConversationRepository {
  async createGroup(data: CreateGroupData): Promise<string> {
    const conversationId = generateId();
    const now = new Date();
    const allParticipantIds = [...new Set([data.createdBy, ...data.participantIds])];

    await backendConversationRepository.create({
      id: conversationId,
      type: 'group',
      name: data.name,
      description: data.description ?? null,
      image_url: data.imageURL ?? null,
      created_by: data.createdBy,
      member_count: allParticipantIds.length,
      metadata: data.isSupportGroup != null
        ? { isSupportGroup: data.isSupportGroup, category: data.category }
        : {},
      last_message: null,
    });

    const batch = allParticipantIds.map(async (uid) => {
      await conversationParticipantRepository.create({
        conversation_id: conversationId,
        user_id: uid,
        role: uid === data.createdBy ? 'admin' : 'member',
        joined_at: now.toISOString(),
        last_read_at: now.toISOString(),
      });

      await userConversationRepository.create({
        conversation_id: conversationId,
        user_id: uid,
        last_read_at: now.toISOString(),
        last_message_at: now.toISOString(),
        last_message_preview: 'Group created',
        is_pinned: false,
        is_muted: false,
      });
    });

    await Promise.all(batch);
    return conversationId;
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const row = await backendConversationRepository.get(conversationId);
      if (!row) return null;
      return mapRowToConversation(row);
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }

  async getUserConversations(uid: string): Promise<UserConversation[]> {
    try {
      const rows = await userConversationRepository.listByUser();
      return rows.map(mapRowToUserConv);
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  async addParticipant(conversationId: string, uid: string): Promise<void> {
    const now = new Date();

    await conversationParticipantRepository.create({
      conversation_id: conversationId,
      user_id: uid,
      role: 'member',
      joined_at: now.toISOString(),
      last_read_at: now.toISOString(),
    });

    await userConversationRepository.create({
      conversation_id: conversationId,
      user_id: uid,
      last_read_at: now.toISOString(),
      last_message_at: now.toISOString(),
      last_message_preview: 'You joined the group',
      is_pinned: false,
      is_muted: false,
    });

    await backendConversationRepository.addParticipantCount(conversationId, 1);
  }

  async removeParticipant(conversationId: string, uid: string): Promise<void> {
    await conversationParticipantRepository.remove(conversationId, uid);
    await userConversationRepository.remove(uid, conversationId);
    await backendConversationRepository.addParticipantCount(conversationId, -1);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const conv = await backendConversationRepository.get(conversationId);
    if (!conv) return;

    const participants = await conversationParticipantRepository.listByConversation(conversationId);

    const cleanup = participants.map((p) =>
      userConversationRepository.remove(p.user_id, conversationId),
    );
    await Promise.all(cleanup);

    for (const p of participants) {
      await conversationParticipantRepository.remove(conversationId, p.user_id);
    }

    await backendConversationRepository.remove(conversationId);
  }

  async updateLastMessage(
    conversationId: string,
    message: { content: string; senderId: string; senderName: string; timestamp: Date },
  ): Promise<void> {
    const conv = await backendConversationRepository.get(conversationId);
    if (!conv) return;

    await backendConversationRepository.update(conversationId, {
      last_message: {
        content: message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: message.timestamp.toISOString(),
      },
    });

    const participants = await conversationParticipantRepository.listByConversation(conversationId);
    const updates = participants.map((p) =>
      userConversationRepository.update(p.user_id, conversationId, {
        last_message_preview: message.content,
        last_message_at: message.timestamp.toISOString(),
      }),
    );
    await Promise.all(updates);
  }
}

export const conversationRepository = new ConversationRepository();
export default conversationRepository;
