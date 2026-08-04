import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Platform } from 'react-native';
import { ArrowLeft, History } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius, typography } from '@/core/theme/tokens';
import { LAYOUT } from '@/shared/constants';

function formatSessionTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    const hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

interface ChatHeaderProps {
  showBackButton?: boolean;
  title: string;
  status?: string;
  onBackPress?: () => void;
  inConversation?: boolean;
  sessionStartedAt?: Date;
  onHistoryPress?: () => void;
}

const BACK_BUTTON_SIZE = 36;
const STATUS_DOT_SIZE = 7;

export function ChatHeader({
  showBackButton = false,
  title,
  status = 'Listening',
  onBackPress,
  inConversation = false,
  sessionStartedAt,
  onHistoryPress,
}: ChatHeaderProps) {
  const { colors } = useTheme();

  // Pulse animation for the "Listening" status dot
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1800 }),
        withTiming(1.0, { duration: 1800 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 1800 }),
        withTiming(1.0, { duration: 1800 })
      ),
      -1,
      true
    );
  }, [scale, opacity]);

  const pulsatingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Resolve content based on conversation state
  const resolvedTitle = inConversation ? "Today's Companion" : "Jouspace";
  const resolvedSubtitle = inConversation && sessionStartedAt
    ? `Session started ${formatSessionTime(sessionStartedAt)}`
    : "Always here when you need it";

  const handleBackPress = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    onBackPress?.();
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={[styles.container, { backgroundColor: colors.surface.primary }]}>
        <View style={styles.backSection}>
          {showBackButton && inConversation ? (
            <Pressable
              onPress={handleBackPress}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: pressed
                    ? colors.brand.subtle
                    : 'transparent',
                },
              ]}
              hitSlop={spacing.sm}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ArrowLeft size={20} color={colors.text.primary} strokeWidth={2.5} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
        </View>

        <View style={styles.leftSection}>
          {!inConversation && (
            <View style={styles.logoContainer}>
              <Image
                source={require('@/shared/assets/jouspace-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              {/* Subtle ring around logo */}
              <View style={[styles.logoRing, { borderColor: colors.brand.primary + '30' }]} />
            </View>
          )}
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.titleText,
                { color: colors.text.primary },
                !inConversation && styles.brandingTitle,
              ]}
              numberOfLines={1}
            >
              {resolvedTitle}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.statusRow}>
                {/* Outer glow ring */}
                <View style={styles.statusDotOuter}>
                  <Animated.View
                    style={[
                      styles.statusGlow,
                      pulsatingStyle,
                      { backgroundColor: colors.success + '30' },
                    ]}
                  />
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                </View>
                <Text style={[styles.statusText, { color: colors.text.secondary }]}>
                  {status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {onHistoryPress && (
          <View style={styles.rightSection}>
            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                onHistoryPress();
              }}
              style={({ pressed }) => [
                styles.historyButton,
                { backgroundColor: pressed ? colors.brand.subtle : 'transparent' },
              ]}
              hitSlop={spacing.sm}
              accessibilityLabel="View chat history"
              accessibilityRole="button"
            >
              <History size={20} color={colors.text.primary} strokeWidth={2} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Gradient accent line */}
      <View style={styles.accentLineContainer}>
        <Svg width="100%" height={1.5} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="headerAccent" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.brand.primary} stopOpacity={0} />
              <Stop offset="20%" stopColor={colors.brand.primary} stopOpacity={0.4} />
              <Stop offset="50%" stopColor={colors.brand.secondary} stopOpacity={0.5} />
              <Stop offset="80%" stopColor={colors.brand.primary} stopOpacity={0.4} />
              <Stop offset="100%" stopColor={colors.brand.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#headerAccent)" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: LAYOUT.HEADER_HEIGHT,
    paddingHorizontal: spacing.lg,
  },
  backSection: {
    marginRight: spacing.xs,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginRight: spacing.sm + 2,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#7866D7',
  },
  logoRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  brandingTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDotOuter: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  statusGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusDot: {
    width: STATUS_DOT_SIZE,
    height: STATUS_DOT_SIZE,
    borderRadius: STATUS_DOT_SIZE / 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dotDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 7,
  },
  subtitleText: {
    fontSize: 11.5,
    fontWeight: '500',
    flexShrink: 1,
    letterSpacing: 0.1,
  },
  historyButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentLineContainer: {
    height: 1.5,
    width: '100%',
  },
});

export default ChatHeader;
