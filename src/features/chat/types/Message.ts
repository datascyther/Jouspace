export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageType =
  | 'markdown'
  | 'reflection'
  | 'exercise'
  | 'journal'
  | 'breathing'
  | 'cbt-exercise'
  | 'wellness'
  | 'insight'
  // Phase 2 conversation blocks
  | 'question'
  | 'action'
  | 'summary'
  | 'resource';

export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'failed';

export interface MessageSource {
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
}

export interface MessageMetadata {
  reasoning?: string;
  errorMessage?: string;
  sources?: MessageSource[];
  mood?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  createdAt: Date;
  status: MessageStatus;
  metadata?: MessageMetadata;
}

const VALID_TYPES: MessageType[] = [
  'markdown', 'reflection', 'exercise', 'journal', 'breathing',
  'cbt-exercise', 'wellness', 'insight', 'question', 'action', 'summary', 'resource',
];

export function validateMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    typeof m.role === 'string' &&
    ['user', 'assistant', 'system'].includes(m.role) &&
    typeof m.type === 'string' &&
    VALID_TYPES.includes(m.type as MessageType) &&
    typeof m.content === 'string' &&
    m.createdAt instanceof Date &&
    typeof m.status === 'string' &&
    ['sending', 'streaming', 'complete', 'failed'].includes(m.status)
  );
}

