import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { borderRadius, spacing } from '@/core/theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');

function SkeletonLine({ width, height = 14, delay, style }: { width: number | string; height?: number; delay: number; style?: any }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.65, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.skeletonLine,
        {
          width: width as any,
          height,
          backgroundColor: colors.border.strong,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export function ConversationSkeleton() {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      accessibilityLabel="Loading conversation"
    >
      {/* 1. AI message bubble skeleton */}
      <View style={[styles.aiBubble, { backgroundColor: colors.surface.secondary, borderColor: colors.border.subtle }]}>
        <View style={styles.headerRow}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.border.strong }]} />
          <View style={styles.headerMeta}>
            <SkeletonLine width={60} height={12} delay={0} />
          </View>
        </View>
        <View style={styles.bodyBlock}>
          <SkeletonLine width="90%" delay={100} />
          <SkeletonLine width="75%" delay={200} />
          <SkeletonLine width="45%" delay={300} />
        </View>
      </View>

      {/* 2. User message bubble skeleton */}
      <View style={styles.userSection}>
        <View style={[styles.userBubble, { backgroundColor: colors.brand.primary + '18' }]}>
          <SkeletonLine width="75%" delay={250} style={{ backgroundColor: colors.brand.secondary + '40' }} />
          <SkeletonLine width="50%" delay={350} style={{ backgroundColor: colors.brand.secondary + '40', marginTop: 8 }} />
        </View>
      </View>

      {/* 3. AI message bubble skeleton */}
      <View style={[styles.aiBubble, { backgroundColor: colors.surface.secondary, borderColor: colors.border.subtle }]}>
        <View style={styles.headerRow}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.border.strong }]} />
          <View style={styles.headerMeta}>
            <SkeletonLine width={60} height={12} delay={200} />
          </View>
        </View>
        <View style={styles.bodyBlock}>
          <SkeletonLine width="95%" delay={300} />
          <SkeletonLine width="85%" delay={400} />
          <SkeletonLine width="60%" delay={500} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flex: 1,
    gap: 12,
  },
  aiBubble: {
    borderRadius: borderRadius.xl,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 9,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  headerMeta: {
    justifyContent: 'center',
  },
  bodyBlock: {
    gap: 8,
  },
  userSection: {
    alignItems: 'flex-end',
    width: '100%',
  },
  userBubble: {
    width: '78%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonLine: {
    borderRadius: 6,
  },
});

export default ConversationSkeleton;
