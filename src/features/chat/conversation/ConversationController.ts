export interface ConversationController {
  sendMessage(text: string, mode?: 'standard' | 'deep'): Promise<void>;
  retry(): Promise<void>;
  regenerate(): Promise<void>;
  abort(): void;
  clear(): void;
  refresh(): Promise<void>;
  dismissMessage(id: string): void;
  deleteMessage?(id: string): void;
  resumeLastConversation?(): Promise<void>;
}
