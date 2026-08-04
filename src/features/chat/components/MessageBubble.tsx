import React from 'react';
import type { Message } from '../types';
import { AIMessageBubble } from './AIMessageBubble';
import { UserMessageBubble } from './UserMessageBubble';
import { ErrorBubble } from './ErrorBubble';

interface MessageBubbleProps {
  message: Message;
  onRetry: () => void;
  onDismiss: (id: string) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: () => void;
  onCopy?: (text: string) => void;
  onFeedback?: (type: 'helpful' | 'unhelpful') => void;
  /** Phase 6 — Jouspace-native actions */
  onSaveReflection?: (messageId: string) => void;
  onContinueLater?: (messageId: string) => void;
  onShareInsight?: (messageId: string) => void;
  onAskFollowUp?: (messageId: string) => void;
  /** True when the previous message has the same role */
  isGrouped?: boolean;
  /** True when this is the first message in its group */
  isFirst?: boolean;
  /** True when this is the last message in its group */
  isLast?: boolean;
  /** Tracks message IDs already spoken so historical messages aren't re-read */
  spokenIdsRef?: React.MutableRefObject<Set<string>>;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  onRetry,
  onDismiss,
  onDelete,
  onRegenerate,
  onCopy,
  onFeedback,
  onSaveReflection,
  onContinueLater,
  onShareInsight,
  onAskFollowUp,
  isGrouped,
  isFirst,
  isLast,
  spokenIdsRef,
}: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <UserMessageBubble
        message={message}
        onCopy={onCopy}
        onDelete={onDelete}
        isGrouped={isGrouped}
        isFirst={isFirst}
        isLast={isLast}
      />
    );
  }

  if (message.status === 'failed') {
    return (
      <ErrorBubble
        message={message.metadata?.errorMessage ?? 'Something went wrong. Tap to retry.'}
        onRetry={onRetry}
        onDismiss={() => onDismiss(message.id)}
      />
    );
  }

  return (
    <AIMessageBubble
      message={message}
      onCopy={onCopy}
      onFeedback={onFeedback}
      onDelete={onDelete}
      onRegenerate={onRegenerate}
      onSaveReflection={onSaveReflection}
      onContinueLater={onContinueLater}
      onShareInsight={onShareInsight}
      onAskFollowUp={onAskFollowUp}
      isGrouped={isGrouped}
      isFirst={isFirst}
      isLast={isLast}
      spokenIdsRef={spokenIdsRef}
    />
  );
});

export default MessageBubble;
