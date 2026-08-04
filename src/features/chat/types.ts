import type { MessageRole, MessageStatus, Message, MessageType, MessageMetadata } from './types/Message';
export type { MessageRole, MessageStatus, Message, MessageType, MessageMetadata };
export { validateMessage } from './types/Message';

export type ChatViewState = 'loading' | 'empty' | 'conversation' | 'error';

export interface ChatStreamState {
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  retryLast: () => Promise<void>;
  clearError: (id: string) => void;
  clearConversation: () => void;
}
