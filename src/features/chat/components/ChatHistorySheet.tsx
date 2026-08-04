import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ScrollView, Platform } from 'react-native';
import { X, ChevronRight, History } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/core/theme/tokens';
import { useRealtimeChatHistory } from '@/hooks/realtime/useRealtimeChatHistory';
import { groupIntoSessions, groupSessionsByDate, formatSessionTime } from '../utils/chatHistory';
import type { ChatMessage } from '@/shared/types';

interface ChatHistorySheetProps {
  visible: boolean;
  onClose: () => void;
  uid: string | null;
}

export function ChatHistorySheet({ visible, onClose, uid }: ChatHistorySheetProps) {
  const { colors } = useTheme();
  const { data: messages = [], isLoading } = useRealtimeChatHistory(uid);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const sessions = groupIntoSessions(messages as ChatMessage[]);
  const datedSections = groupSessionsByDate(sessions);
  const selectedSession = selectedSessionId
    ? sessions.find(s => s.id === selectedSessionId)
    : null;

  const handleSelectSession = (id: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setSelectedSessionId(id);
  };

  const handleBackToList = () => {
    setSelectedSessionId(null);
  };

  const handleClose = () => {
    setSelectedSessionId(null);
    onClose();
  };

  const renderSessionRow = (session: { id: string; title: string; preview: string; lastAt: Date; messageCount: number }) => (
    <Pressable
      key={session.id}
      onPress={() => handleSelectSession(session.id)}
      style={({ pressed }) => [
        styles.sessionRow,
        pressed && { backgroundColor: colors.surface.secondary },
      ]}
      accessibilityRole="menuitem"
    >
      <View style={styles.sessionContent}>
        <Text style={[styles.sessionTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={[styles.sessionPreview, { color: colors.text.tertiary }]} numberOfLines={1}>
          {session.preview}
        </Text>
        <Text style={[styles.sessionMeta, { color: colors.text.tertiary }]}>
          {formatSessionTime(session.lastAt)} · {session.messageCount} {session.messageCount === 1 ? 'message' : 'messages'}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={2} />
    </Pressable>
  );

  const renderGuestState = () => (
    <View style={styles.emptyState}>
      <History size={32} color={colors.text.tertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        Sign in to view your history
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
        Your conversation history will appear here once you sign in with your Google account.
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <History size={32} color={colors.text.tertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        No past conversations yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
        Start a conversation and it will appear here.
      </Text>
    </View>
  );

  const renderTranscript = () => {
    if (!selectedSession) return null;
    return (
      <View style={styles.transcriptContainer}>
        <Pressable
          onPress={handleBackToList}
          style={({ pressed }) => [
            styles.backRow,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to history list"
        >
          <Text style={[styles.backArrow, { color: colors.brand.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.brand.primary }]}>History</Text>
        </Pressable>

        <ScrollView style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.transcriptTitle, { color: colors.text.primary }]}>
            {selectedSession.title}
          </Text>
          <Text style={[styles.transcriptMeta, { color: colors.text.tertiary }]}>
            {selectedSession.messageCount} messages · {formatSessionTime(selectedSession.startedAt)}
          </Text>

          <View style={styles.transcriptMessages}>
            {selectedSession.messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.transcriptBubble,
                  msg.isUser
                    ? [styles.userBubble, { backgroundColor: colors.brand.primary + '15' }]
                    : [styles.assistantBubble, { backgroundColor: colors.surface.secondary }],
                  { borderColor: colors.border.subtle },
                ]}
              >
                <Text
                  style={[
                    styles.transcriptRole,
                    { color: msg.isUser ? colors.brand.primary : colors.text.secondary },
                  ]}
                >
                  {msg.isUser ? 'You' : 'Jouspace'}
                </Text>
                <Text
                  style={[styles.transcriptContent, { color: colors.text.primary }]}
                >
                  {msg.content}
                </Text>
                <Text style={[styles.transcriptTime, { color: colors.text.tertiary }]}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.overlay.medium }]}
        >
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface.primary,
              borderTopColor: colors.border.default,
              shadowColor: colors.brand.primaryDeep,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border.strong }]} />

          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              {selectedSession ? 'Conversation' : 'Chat History'}
            </Text>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: pressed ? colors.surface.secondary : 'transparent' },
              ]}
              hitSlop={spacing.sm}
              accessibilityRole="button"
              accessibilityLabel="Close history"
            >
              <X size={18} color={colors.text.secondary} strokeWidth={2.5} />
            </Pressable>
          </View>

          {!uid ? (
            renderGuestState()
          ) : isLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
                Loading history...
              </Text>
            </View>
          ) : selectedSession ? (
            renderTranscript()
          ) : sessions.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {datedSections.map((section) => (
                <View key={section.label} style={styles.sectionGroup}>
                  <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                    {section.label}
                  </Text>
                  <View style={[styles.sectionCards, { borderColor: colors.border.subtle }]}>
                    {section.sessions.map(renderSessionRow)}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: borderRadius['glass-lg'] || 24,
    borderTopRightRadius: borderRadius['glass-lg'] || 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? spacing.xl : spacing['2xl'],
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1.5,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 36,
    height: 4.5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flexGrow: 0,
  },
  sectionGroup: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
  },
  sectionCards: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  sessionContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionPreview: {
    fontSize: 12.5,
    fontWeight: '400',
    marginBottom: 3,
    lineHeight: 17,
  },
  sessionMeta: {
    fontSize: 11,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    fontWeight: '400',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  transcriptContainer: {
    flex: 1,
    maxHeight: 500,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptScroll: {
    flexGrow: 0,
  },
  transcriptTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    paddingHorizontal: spacing.xs,
  },
  transcriptMeta: {
    fontSize: 11.5,
    fontWeight: '400',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  transcriptMessages: {
    gap: spacing.sm,
  },
  transcriptBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '92%',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  transcriptRole: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  transcriptContent: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  transcriptTime: {
    fontSize: 10.5,
    fontWeight: '400',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
});

export default ChatHistorySheet;
