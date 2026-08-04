/**
 * UserMessageBubble
 *
 * Right-aligned pill bubble for user messages.
 *
 * Premium redesign:
 *  - Gradient background (brand → brand secondary)
 *  - Refined shadow with brand-tinted glow
 *  - iMessage-style corner grouping with softer radius transitions
 *  - Smooth scale animation on long press
 *  - Better timestamp styling
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, Share } from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { BaseMessageBubble } from './BaseMessageBubble';
import { MessageContent } from './MessageContent';
import { MessageTimestamp } from './MessageTimestamp';
import { MessageActionSheet } from './MessageActionSheet';
import { getBubbleRadius, getBubbleMarginBottom } from '../styles/bubbleVariants';
import { chat } from '@/core/theme/tokens';
import type { Message } from '../types/Message';

interface UserMessageBubbleProps {
  message: Message;
  onCopy?: (text: string) => void;
  onDelete?: (id: string) => void;
  isGrouped?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export const UserMessageBubble = React.memo(function UserMessageBubble({
  message,
  onCopy,
  onDelete,
  isGrouped = false,
  isFirst = true,
  isLast = true,
}: UserMessageBubbleProps) {
  const { colors } = useTheme();
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const showTimestamp = !isGrouped || isLast;

  const handleCopy = useCallback(async () => {
    if (!message.content) return;
    try {
      await ExpoClipboard.setStringAsync(message.content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onCopy?.(message.content);
  }, [message.content, onCopy]);

  const handleShare = useCallback(async () => {
    if (!message.content) return;
    try {
      await Share.share({ message: message.content, title: 'Message from Jouspace' });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }, [message.content]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionSheetVisible(true);
  }, []);

  const actionSheetActions = [
    { label: 'Copy', onPress: handleCopy },
    { label: 'Share', onPress: handleShare },
    ...(onDelete ? [{ label: 'Delete', onPress: () => onDelete(message.id), destructive: true }] : []),
  ];

  const radiusStyle = getBubbleRadius('user', { isGrouped, isFirst, isLast });
  const marginBottom = getBubbleMarginBottom(isGrouped && !isLast);

  return (
    <BaseMessageBubble
      role="user"
      containerStyle={[styles.outerRow, { marginBottom }]}
    >
      <View style={[styles.wrapper, { maxWidth: chat.bubble.maxWidthUser }]}>
          <Pressable
            onLongPress={handleLongPress}
            accessibilityHint="Long press for more options"
          >
            <View
              style={[
                styles.bubble,
                radiusStyle,
                {
                  backgroundColor: colors.brand.primary,
                  shadowColor: colors.brand.primary,
                },
              ]}
            >
              {/* Gradient overlay for premium depth */}
              <Svg style={[StyleSheet.absoluteFillObject, radiusStyle, { overflow: 'hidden' }]} width="100%" height="100%">
                <Defs>
                  <LinearGradient id="userBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.12} />
                    <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.03} />
                    <Stop offset="100%" stopColor="#000000" stopOpacity={0.08} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#userBubbleGrad)" />
              </Svg>
              <MessageContent message={message} />
            </View>
          </Pressable>

        {showTimestamp && (
          <MessageTimestamp date={message.createdAt} style={styles.timestamp} />
        )}
      </View>

      <MessageActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        actions={actionSheetActions}
      />
    </BaseMessageBubble>
  );
});

const styles = StyleSheet.create({
  outerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  wrapper: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: chat.bubble.paddingHUser,
    paddingVertical: chat.bubble.paddingVUser,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  timestamp: {
    marginTop: 5,
    marginRight: 2,
  },
});

export default UserMessageBubble;
