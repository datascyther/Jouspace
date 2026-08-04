import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message } from '@/features/chat/types';

vi.mock('../../backend/repositories/ChatMessageRepository', () => ({
  chatMessageRepository: {
    listByUser: vi.fn().mockResolvedValue([]),
    listByConversation: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    getLatestConversationId: vi.fn().mockResolvedValue(null),
  },
}));

import { ChatRepository } from './ChatRepository';

describe('ChatRepository', () => {
  let repo: ChatRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ChatRepository();
  });

  describe('saveMessages', () => {
    const makeMsg = (id: string, status: Message['status']): Message => ({
      id,
      role: 'user',
      type: 'markdown',
      content: 'Hello',
      createdAt: new Date(),
      status,
    });

    it('filters out messages with status !== complete', async () => {
      const { chatMessageRepository } = await import('../../backend/repositories/ChatMessageRepository');
      const msgs = [
        makeMsg('1', 'complete'),
        makeMsg('2', 'streaming'),
        makeMsg('3', 'failed'),
        makeMsg('4', 'complete'),
      ];

      await repo.saveMessages('test-uid', msgs, 'conv-1');

      expect(chatMessageRepository.create).toHaveBeenCalledTimes(2);
    });

    it('passes correct data for each message', async () => {
      const { chatMessageRepository } = await import('../../backend/repositories/ChatMessageRepository');
      const msgs = [makeMsg('1', 'complete')];

      await repo.saveMessages('test-uid', msgs, 'conv-1');

      expect(chatMessageRepository.create).toHaveBeenCalledWith({
        content: 'Hello',
        is_user: true,
        conversation_id: 'conv-1',
        reasoning: null,
      });
    });
  });
});
