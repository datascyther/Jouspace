/**
 * ErrorBubble
 *
 * Inline error display for failed AI responses.
 * Appears in the message list at the position of the failed message.
 *
 * Shows:
 *   - A friendly error message
 *   - "Retry" tap target (calls retryLast)
 *   - "Dismiss" X button (calls clearError)
 *
 * Premium redesign:
 *   - Glassmorphic card with red/danger accent line
 *   - Better icon badge
 *   - Pill button with clean typography and press states
 *   - Smooth shake animation on load
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertCircle, RotateCcw, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { borderRadius, spacing } from '@/core/theme/tokens';

interface ErrorBubbleProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorBubble({ message, onRetry, onDismiss }: ErrorBubbleProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    translateX.value = withSequence(
      withSpring(-6, { damping: 4, stiffness: 200 }),
      withSpring(6, { damping: 4, stiffness: 200 }),
      withSpring(-3, { damping: 4, stiffness: 200 }),
      withSpring(3, { damping: 4, stiffness: 200 }),
      withSpring(0, { damping: 4, stiffness: 200 })
    );
  }, []);

  const handleRetry = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    onRetry();
  };

  const handleDismiss = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    onDismiss();
  };

  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.container}>
      <Animated.View
        style={[
          styles.bubble,
          shakeStyle,
          {
            backgroundColor: colors.surface.secondary,
            borderColor: colors.danger + '20',
          },
        ]}
      >
        {/* Accent line on left edge */}
        <View style={[styles.accentLine, { backgroundColor: colors.danger }]} />

        {/* Icon + Message */}
        <View style={styles.topRow}>
          <View style={[styles.iconContainer, { backgroundColor: colors.dangerSubtle }]}>
            <AlertCircle
              size={15}
              color={colors.danger}
              strokeWidth={2.5}
            />
          </View>
          <Text
            style={[styles.errorText, { color: colors.text.primary }]}
            numberOfLines={4}
          >
            {message}
          </Text>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.retryButton,
              {
                backgroundColor: colors.danger,
                shadowColor: colors.danger,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retry message"
          >
            <RotateCcw size={12} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>

          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.dismissButton,
              {
                backgroundColor: colors.surface.tertiary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
          >
            <X size={13} color={colors.text.secondary} strokeWidth={2.5} />
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  bubble: {
    borderRadius: borderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ErrorBubble;
