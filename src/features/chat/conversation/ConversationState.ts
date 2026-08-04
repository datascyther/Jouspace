import type { Message } from '../types/Message';

export type ConversationStatus = 'idle' | 'sending' | 'streaming' | 'complete' | 'error';

export interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  status: ConversationStatus;
  isReflecting: boolean;
  error?: string;
}
