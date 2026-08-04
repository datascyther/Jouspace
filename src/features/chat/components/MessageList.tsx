import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ListRenderItem,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/core/theme/tokens';
import { EmptyConversation } from './EmptyConversation';
import { MessageBubble } from './MessageBubble';
import { ConversationSkeleton } from './ConversationSkeleton';
import { TypingIndicator } from './TypingIndicator';
import type { Message, ChatViewState } from '../types';
import type { ConversationState } from '../conversation/ConversationState';

const SCROLL_THRESHOLD = 80;

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

interface MessageListProps {
  state: ConversationState;
  onRefresh?: () => Promise<void>;
  onQuickStarterSelect?: (text: string) => void;
  onRetry: () => void;
  onDismiss: (id: string) => void;
  isRestored?: boolean;
  onDelete?: (id: string) => void;
  onRegenerate?: () => void;
  onCopy?: (text: string) => void;
  onFeedback?: (type: 'helpful' | 'unhelpful') => void;
  /** Phase 6 — Jouspace-native actions */
  onSaveReflection?: (messageId: string) => void;
  onContinueLater?: (messageId: string) => void;
  onShareInsight?: (messageId: string) => void;
  onAskFollowUp?: (messageId: string) => void;
  /** Current system keyboard height in px (0 when hidden). Drives keyboard-aware shifting. */
  keyboardHeight?: number;
}

function deriveViewState(state: ConversationState, showSkeleton: boolean): ChatViewState {
  if (showSkeleton && state.messages.length === 0) return 'loading';
  if (state.messages.length === 0) return 'empty';
  if (state.status === 'error') return 'error';
  return 'conversation';
}

export function MessageList({
  state,
  onRefresh,
  onQuickStarterSelect,
  onRetry,
  onDismiss,
  isRestored = false,
  onDelete,
  onRegenerate,
  onCopy,
  onFeedback,
  onSaveReflection,
  onContinueLater,
  onShareInsight,
  onAskFollowUp,
  keyboardHeight = 0,
}: MessageListProps) {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList<Message>>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);

  const isNearBottomRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  const prevKeyboardHeightRef = useRef(0);

  // IDs of messages present at first mount. These are restored/historical
  // messages that must NOT be auto-spoken when voice responses are enabled.
  const spokenIdsRef = useRef<Set<string>>(
    new Set(state.messages.map((m) => m.id))
  );

  const scrollMetrics = useRef({
    contentHeight: 0,
    layoutHeight: 0,
    scrollY: 0,
  });

  const scrollToEnd = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  const prevMessagesLength = useRef(0);

  useEffect(() => {
    if (prevMessagesLength.current === 0 && state.messages.length > 0) {
      scrollToEnd(false);
    }
    prevMessagesLength.current = state.messages.length;
  }, [state.messages.length, scrollToEnd]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      scrollMetrics.current = {
        contentHeight: contentSize.height,
        layoutHeight: layoutMeasurement.height,
        scrollY: contentOffset.y,
      };

      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      const nearBottom = distanceFromBottom < SCROLL_THRESHOLD;
      isNearBottomRef.current = nearBottom;

      if (nearBottom) {
        setShowNewMessagesButton(false);
      }
    },
    []
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      scrollMetrics.current.contentHeight = height;
      if (isNearBottomRef.current) {
        scrollToEnd(true);
      } else if (state.messages.length > 0) {
        setShowNewMessagesButton(true);
      }
    },
    [scrollToEnd, state.messages.length]
  );

  const handleLayout = useCallback(() => {
    if (isNearBottomRef.current) {
      scrollToEnd(false);
    }
  }, [scrollToEnd]);

  // --- Keyboard-aware shifting ---
  // When the system keyboard opens (user is typing), the streaming indicator
  // (ListFooterComponent) must shift up into view above the keyboard. The
  // composer is lifted by the keyboard-height inset applied in ChatScreen, but
  // the FlatList is not automatically re-scrolled, so the footer can remain
  // hidden below the fold. Driven by `keyboardHeight` (cross-platform hook),
  // reveal the latest content above the keyboard whenever the user is near the
  // bottom or AI is streaming.
  useEffect(() => {
    if (keyboardHeight <= 0 && prevKeyboardHeightRef.current <= 0) return;
    prevKeyboardHeightRef.current = keyboardHeight;

    // Defer so layout (inset / window resize) settles first.
    const raf = requestAnimationFrame(() => {
      if (isNearBottomRef.current || statusRef.current === 'streaming') {
        scrollToEnd(true);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [keyboardHeight, scrollToEnd]);

  const handleNewMessagesPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNewMessagesButton(false);
    scrollToEnd(true);
  }, [scrollToEnd]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const viewState = deriveViewState(state, showSkeleton);
  const messages = state.messages;
  const keyExtractor = useCallback((item: Message) => item.id, []);

  const renderItem: ListRenderItem<Message> = useCallback(
    ({ item, index }) => {
      const prevItem = index > 0 ? messages[index - 1] : null;
      const nextItem = index < messages.length - 1 ? messages[index + 1] : null;

      // Same role as previous → grouped (not first in its group)
      const isGrouped = prevItem !== null && prevItem.role === item.role;
      // First in a run of same-role messages
      const isFirst = !isGrouped;
      // Last in a run: next message has a different role or doesn't exist
      const isLast = nextItem === null || nextItem.role !== item.role;

      return (
        <MessageBubble
          message={item}
          isGrouped={isGrouped}
          isFirst={isFirst}
          isLast={isLast}
          onRetry={onRetry}
          onDismiss={onDismiss}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onCopy={onCopy}
          onFeedback={onFeedback}
          onSaveReflection={onSaveReflection}
          onContinueLater={onContinueLater}
          onShareInsight={onShareInsight}
          onAskFollowUp={onAskFollowUp}
          spokenIdsRef={spokenIdsRef}
        />
      );
    },
    [messages, onRetry, onDismiss, onDelete, onRegenerate, onCopy, onFeedback, onSaveReflection, onContinueLater, onShareInsight, onAskFollowUp]
  );

  if (viewState === 'loading') {
    return <View style={{ flex: 1 }}><ConversationSkeleton /></View>;
  }

  const isEmpty = messages.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={[styles.list, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={[
          styles.contentContainer,
          isEmpty && styles.emptyContent,
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={10}
        windowSize={7}
        initialNumToRender={10}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        ListHeaderComponent={
          isRestored && messages.length > 0 ? (
            <View style={styles.restoreHeader}>
              <Text style={[styles.restoreText, { color: colors.text.secondary }]}>
                Continue from {formatDate(messages[0].createdAt)}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          viewState === 'empty' ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(200)}
              style={styles.emptyContainer}
            >
              <EmptyConversation 
                onQuickStarterSelect={onQuickStarterSelect} 
              />
            </Animated.View>
          ) : null
        }
        ListFooterComponent={
          state.isReflecting ? (
            <TypingIndicator />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      />

      {showNewMessagesButton && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.floatingButtonContainer}
        >
          <Pressable
            onPress={handleNewMessagesPress}
            style={[styles.floatingButton, { backgroundColor: colors.brand.primary }]}
            accessibilityLabel="Scroll to latest messages"
            accessibilityRole="button"
          >
            <ChevronDown size={12} color={colors.brand.contrastText} strokeWidth={3} />
            <Text style={[styles.floatingButtonText, { color: colors.brand.contrastText }]}>
              New messages
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: 0,
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: spacing.sm,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  restoreHeader: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  floatingButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MessageList;
