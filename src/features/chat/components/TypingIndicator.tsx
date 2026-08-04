import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

const DOT_SIZE = 8;
const DOT_GAP = 6;

function AnimatedDot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.4, { duration: 400 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.dotWrapper, animStyle]}>
      <Svg width={DOT_SIZE} height={DOT_SIZE} viewBox="0 0 24 24">
        <Defs>
          <LinearGradient id="dotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.brand.primary} />
            <Stop offset="100%" stopColor={colors.brand.secondary} />
          </LinearGradient>
        </Defs>
        <Circle cx="12" cy="12" r="12" fill="url(#dotGrad)" />
      </Svg>
    </Animated.View>
  );
}

export const TypingIndicator = React.memo(function TypingIndicator() {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(250).springify().damping(15)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, { backgroundColor: colors.surface.secondary, borderColor: colors.border.subtle }]}
      accessibilityLabel="Jouspace is reflecting for you"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.contentRow}>
        <View style={styles.dotsRow}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={150} />
          <AnimatedDot delay={300} />
        </View>
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          wellness
        </Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOT_GAP,
  },
  dotWrapper: {
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default TypingIndicator;
