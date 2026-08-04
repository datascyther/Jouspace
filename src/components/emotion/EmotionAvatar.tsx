import React, { memo, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Path,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  useAnimatedProps,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import {
  EMOTION_COLORS,
  EMOTION_ANIMATION,
  triggerEmotionHaptic,
  type EmotionType,
} from '@/constants/emotions';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface EmotionAvatarProps {
  emotion: EmotionType;
  size?: number;
  animated?: boolean;
  selected?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  showGlow?: boolean;
  onPress?: () => void;
}

function EmotionAvatarComponent({
  emotion,
  size = 48,
  animated = true,
  selected = false,
  disabled = false,
  showLabel = false,
  showGlow = true,
  onPress,
}: EmotionAvatarProps) {
  const { isDark, colors } = useTheme();
  const palette = EMOTION_COLORS[emotion];
  const anim = EMOTION_ANIMATION[emotion];

  const primary = isDark ? palette.darkPrimary : palette.primary;
  const secondary = isDark ? palette.darkSecondary : palette.secondary;
  const glowColor = palette.glow;

  const gradId = `orb-${emotion}-${isDark ? 'd' : 'l'}`;
  const glowId = `glow-${emotion}`;

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.85);
  const pressed = useSharedValue(0);
  const ringOpacity = useSharedValue(selected ? 1 : 0);

  const ease = Easing.inOut(Easing.ease);

  useEffect(() => {
    if (!animated) {
      scale.value = 1;
      translateY.value = 0;
      glowOpacity.value = 0.85;
      return;
    }

    switch (anim.type) {
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: anim.duration / 2, easing: ease }),
            withTiming(1, { duration: anim.duration / 2, easing: ease }),
          ),
          -1,
          true,
        );
        break;
      case 'float':
        translateY.value = withRepeat(
          withSequence(
            withTiming(1, { duration: anim.duration / 2, easing: ease }),
            withTiming(0, { duration: anim.duration / 2, easing: ease }),
          ),
          -1,
          true,
        );
        break;
      case 'breathe':
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: anim.duration / 2, easing: ease }),
            withTiming(0.85, { duration: anim.duration / 2, easing: ease }),
          ),
          -1,
          true,
        );
        break;
    }
  }, [animated, anim.type, anim.duration, scale, translateY, glowOpacity]);

  useEffect(() => {
    ringOpacity.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, ringOpacity]);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  } as any));

  const ringColor = primary;

  const label = useMemo(() => palette.label, [palette.label]);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    void triggerEmotionHaptic();
    pressed.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 150 }),
    );
    onPress();
  }, [onPress, pressed]);

  const glowScale = useAnimatedStyle(() => {
    if (!selected) return {};
    return {
      transform: [{ scale: ringOpacity.value === 1 ? 1.2 : 1 }],
    };
  });

  const ringProps = useAnimatedProps(() => ({
    opacity: ringOpacity.value,
  }));

  const orb = (
    <Animated.View style={[avatarStyle, disabled && styles.disabled]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={primary} />
            <Stop offset="100%" stopColor={secondary} />
          </LinearGradient>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity={0.9} />
            <Stop offset="60%" stopColor={glowColor} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
 
        {showGlow && (
          <AnimatedCircle cx="50" cy="50" r="48" fill={`url(#${glowId})`} opacity={glowOpacity} />
        )}

        <Ellipse cx="50" cy="84" rx="26" ry="6" fill="#000000" opacity={0.06} />

        <Circle cx="50" cy="50" r="36" fill={`url(#${gradId})`} />

        <AnimatedCircle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke={selected ? ringColor : 'transparent'}
          strokeWidth={selected ? 3 : 0}
          animatedProps={ringProps}
        />

        <Ellipse cx="40" cy="36" rx="14" ry="9" fill="#FFFFFF" opacity={0.18} />

        <EmotionFace emotion={emotion} />
      </Svg>
    </Animated.View>
  );

  const content = showLabel ? (
    <View style={styles.labelWrap}>
      {orb}
      <Animated.Text
        style={[styles.label, { color: disabled ? colors.text.disabled : colors.text.secondary }]}
      >
        {label}
      </Animated.Text>
    </View>
  ) : (
    orb
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        hitSlop={4}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      {content}
    </View>
  );
}

function EmotionFace({ emotion }: { emotion: EmotionType }) {
  const mouths: Record<EmotionType, string> = {
    great: 'M40 60 Q50 70 60 60',
    good: 'M41 61 Q50 68 59 61',
    calm: 'M42 62 Q50 66 58 62',
    notGood: 'M41 66 Q50 60 59 66',
    overwhelmed: 'M44 63 Q50 67 56 63',
  };

  if (emotion === 'calm') {
    return (
      <G>
        <Circle cx={38} cy={48} r={3.5} fill="#FFFFFF" />
        <Circle cx={62} cy={48} r={3.5} fill="#FFFFFF" />
        <Path d="M40 64 L60 64" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      </G>
    );
  }

  if (emotion === 'great') {
    const heartD = 'M0-2C-3-7-8-2 0 4C8-2 3-7 0-2Z';
    return (
      <G>
        <Path d="M34 48 Q38 44 42 48" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        <Circle cx={62} cy={48} r={3.5} fill="#FFFFFF" />
        <G transform="translate(50, 63) scale(0.65)">
          <Path d={heartD} fill="#FFFFFF" />
        </G>
      </G>
    );
  }

  if (emotion === 'overwhelmed') {
    const browD = 'M34 43 L42 47 M66 43 L58 47';
    return (
      <G>
        <Path d={browD} stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        <Circle cx={38} cy={48} r={3} fill="#FFFFFF" />
        <Circle cx={62} cy={48} r={3} fill="#FFFFFF" />
        <Path d="M40 66 Q50 60 60 66" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      </G>
    );
  }

  return (
    <G>
      <Ellipse cx={38} cy={48} rx={3.2} ry={4.4} fill="#FFFFFF" />
      <Ellipse cx={62} cy={48} rx={3.2} ry={4.4} fill="#FFFFFF" />
      <Path
        d={mouths[emotion]}
        stroke="#FFFFFF"
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});

export const EmotionAvatar = memo(EmotionAvatarComponent);
export default EmotionAvatar;

export function SparkleMark({ size = 14, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const stroke = color ?? colors.brand.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
      <Defs>
        <LinearGradient id="sparkle-grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={stroke} />
          <Stop offset="100%" stopColor={colors.brand.secondary} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2 C12.6 7 17 11.4 22 12 C17 12.6 12.6 17 12 22 C11.4 17 7 12.6 2 12 C7 11.4 11.4 7 12 2 Z"
        fill="url(#sparkle-grad)"
      />
    </Svg>
  );
}
