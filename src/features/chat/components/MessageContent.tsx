import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { MarkdownRenderer } from './MarkdownRenderer';
import { chat } from '@/core/theme/tokens';
import type { Message } from '../types/Message';

interface MessageContentProps {
  message: Message;
}

export const MessageContent = React.memo(function MessageContent({ message }: MessageContentProps) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';
  const typo = isUser ? chat.typography.bodyUser : chat.typography.bodyAI;
  const color = isUser ? colors.brand.contrastText : colors.text.primary;
  const baseStyle = { ...typo, color };

  return (
    <MarkdownRenderer
      text={message.content}
      baseStyle={baseStyle}
      codeBackground={colors.surface.primary}
      linkColor={colors.brand.primary}
      blockquoteBackground={colors.surface.secondary}
      blockquoteBorder={colors.brand.secondary}
    />
  );
});

export default MessageContent;
