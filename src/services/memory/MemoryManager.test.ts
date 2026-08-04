import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryManager } from './MemoryManager';

describe('MemoryManager', () => {
  let manager: MemoryManager;

  beforeEach(() => {
    manager = new MemoryManager('test-conversation');
  });

  describe('incrementTurn', () => {
    it('increases turn count', () => {
      expect(manager.getSession().turnCount).toBe(0);
      manager.incrementTurn();
      expect(manager.getSession().turnCount).toBe(1);
      manager.incrementTurn();
      expect(manager.getSession().turnCount).toBe(2);
    });
  });

  describe('needsSummarization', () => {
    it('returns false when turn count < 8', () => {
      for (let i = 0; i < 7; i++) {
        manager.incrementTurn();
      }
      expect(manager.needsSummarization()).toBe(false);
    });

    it('returns true when turn count >= 8', () => {
      for (let i = 0; i < 8; i++) {
        manager.incrementTurn();
      }
      expect(manager.needsSummarization()).toBe(true);
    });

    it('after summarization, returns false until 8 more turns', () => {
      for (let i = 0; i < 8; i++) {
        manager.incrementTurn();
      }
      expect(manager.needsSummarization()).toBe(true);

      manager.setSummary('Test summary');
      expect(manager.needsSummarization()).toBe(false);

      for (let i = 0; i < 7; i++) {
        manager.incrementTurn();
      }
      expect(manager.needsSummarization()).toBe(false);

      manager.incrementTurn();
      expect(manager.needsSummarization()).toBe(true);
    });
  });

  describe('setSummary', () => {
    it('stores summary and updates summaryTurnCount', () => {
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();

      const beforeSummaryTurn = manager.getSession().turnCount;
      manager.setSummary('Key topics: anxiety, coping strategies');
      const session = manager.getSession();
      expect(session.summary).toBe('Key topics: anxiety, coping strategies');
      expect(session.summaryTurnCount).toBe(beforeSummaryTurn);
    });
  });

  describe('buildContext', () => {
    it('includes userName when set', () => {
      const m = new MemoryManager('test', { userName: 'Alice' });
      const ctx = m.buildContext();
      expect(ctx.userName).toBe('Alice');
    });

    it('includes mood when set', () => {
      manager.setMood('anxious');
      const ctx = manager.buildContext();
      expect(ctx.previousMood).toBe('anxious');
    });

    it('includes summary when set', () => {
      manager.setSummary('Test summary');
      const ctx = manager.buildContext();
      expect(ctx.summary).toBe('Test summary');
    });

    it('userName is undefined when not set', () => {
      const ctx = manager.buildContext();
      expect(ctx.userName).toBeUndefined();
    });
  });

  describe('buildCondensedHistory', () => {
    const makeMsg = (role: 'user' | 'assistant', content: string) => ({ role, content });

    it('returns full history when no summary yet', () => {
      const history = [
        makeMsg('user', 'Hello'),
        makeMsg('assistant', 'Hi'),
      ];
      const result = manager.buildCondensedHistory(history);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ role: 'user', content: 'Hello' });
    });

    it('injects summary system message + last 6 turns when summary exists', () => {
      manager.setSummary('Conversation summary');

      const history = Array.from({ length: 10 }, (_, i) =>
        makeMsg(i % 2 === 0 ? 'user' : 'assistant', `Message ${i + 1}`)
      );

      const result = manager.buildCondensedHistory(history);
      expect(result).toHaveLength(7); // 1 summary + 6 messages
      expect(result[0]).toEqual({
        role: 'system',
        content: 'Previous conversation summary: Conversation summary',
      });
      expect(result[1].content).toBe('Message 5');
      expect(result[6].content).toBe('Message 10');
    });

    it('with summary + less than 6 messages, returns summary + all messages', () => {
      manager.setSummary('Summary');

      const history = [
        makeMsg('user', 'Hello'),
        makeMsg('assistant', 'Hi'),
      ];

      const result = manager.buildCondensedHistory(history);
      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('system');
      expect(result[1].content).toBe('Hello');
      expect(result[2].content).toBe('Hi');
    });
  });

  describe('adaptive depth (crisis escalation)', () => {
    it('defaults to standard mode', () => {
      expect(manager.getRecommendedMode()).toBe('standard');
    });

    it('escalates to deep mode on crisis signals', () => {
      manager.observeUserMessage('I want to die');
      expect(manager.getRecommendedMode()).toBe('deep');
    });

    it('records non-neutral mood from a user message', () => {
      manager.observeUserMessage('I feel so anxious about everything');
      expect(manager.getSession().recentMood).toBe('anxious');
    });

    it('does not record neutral mood', () => {
      manager.observeUserMessage('Tell me about breathing exercises');
      expect(manager.getSession().recentMood).toBeNull();
    });
  });
});
