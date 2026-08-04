/**
 * Jouspace — EmotionAvatar
 *
 * The reusable, animated, brand-consistent replacement for all Unicode mood
 * emojis. Renders a soft gradient orb with a minimal, calm facial expression
 * and an ambient glow, animated per-emotion via react-native-reanimated.
 *
 * Props:
 *  - emotion:   which emotion to render (canonical EmotionType)
 *  - size:      diameter in px (default 48)
 *  - animated:  enable idle motion (default true)
 *  - selected:  show selection ring (brand / emotion color)
 *  - disabled:  dim the avatar (reduced opacity)
 *  - showLabel: render the emotion label beneath the avatar
 *  - showGlow:  render the ambient glow halo (default true)
 *  - onPress:   when provided, the avatar becomes pressable + haptic
 */

import React, { memo, useEffect, useMemo } from 'react';
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
  withDelay,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import {
  EMOTION_COLORS,
  EMOTION_ANIMATION,
  triggerEmotionHaptic,
  type EmotionType,
} from './emotionConfig';

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

  // Unique gradient ids per emotion + theme to avoid SVG def collisions.
  const gradId = `orb-${emotion}-${isDark ? 'd' : 'l'}`;
  const glowId = `glow-${emotion}`;

  // ── Idle motion shared values ───────────────────────────────────────────
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const translateX = useSharedValue(0);
  const glowOpacity = useSharedValue(0.85);

  useEffect(() => {
    if (!animated) {
      scale.value = 1;
      translateY.value = 0;
      rotate.value = 0;
      translateX.value = 0;
      glowOpacity.value = 0.85;
      return;
    }

    switch (anim.type) {
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: anim.duration / 2 }),
            withTiming(1, { duration: anim.duration / 2 }),
          ),
          -1,
          false,
        );
        break;
      case 'float':
        translateY.value = withRepeat(
          withSequence(
            withTiming(2, { duration: anim.duration / 2 }),
            withTiming(0, { duration: anim.duration / 2 }),
          ),
          -1,
          false,
        );
        break;
      case 'breathe':
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: anim.duration / 2 }),
            withTiming(0.85, { duration: anim.duration / 2 }),
          ),
          -1,
          false,
        );
        break;
      case 'sway':
        rotate.value = withRepeat(
          withSequence(
            withTiming(2, { duration: anim.duration / 3 }),
            withTiming(-2, { duration: anim.duration / 3 }),
            withTiming(0, { duration: anim.duration / 3 }),
          ),
          -1,
          false,
        );
        break;
      case 'wobble':
        translateX.value = withRepeat(
          withSequence(
            withTiming(1.5, { duration: 320 }),
            withTiming(-1.5, { duration: 320 }),
            withDelay(560, withTiming(0, { duration: 200 })),
          ),
          -1,
          false,
        );
        break;
    }
  }, [animated, anim.type, anim.duration, scale, translateY, rotate, translateX, glowOpacity]);

  const avatarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotateZ: `${rotate.value}deg` },
      ],
    } as any;
  }, []);

  const ringColor = selected ? primary : 'transparent';

  const label = useMemo(() => palette.label, [palette.label]);

  const handlePress = () => {
    if (!onPress) return;
    void triggerEmotionHaptic();
    onPress();
  };

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

        {/* Ambient glow halo */}
        {showGlow && (
          <AnimatedCircle cx="50" cy="50" r="48" fill={`url(#${glowId})`} opacity={glowOpacity} />
        )}

        {/* Soft shadow */}
        <Ellipse cx="50" cy="84" rx="26" ry="6" fill="#000000" opacity={0.06} />

        {/* Gradient orb */}
        <Circle cx="50" cy="50" r="36" fill={`url(#${gradId})`} />

        {/* Selection ring */}
        <Circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke={ringColor}
          strokeWidth={selected ? 3 : 0}
        />

        {/* Highlight arc (top-left sheen) */}
        <Ellipse cx="40" cy="36" rx="14" ry="9" fill="#FFFFFF" opacity={0.18} />

        {/* Minimal face */}
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
        accessibilityRole="image"
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

/**
 * Minimal, calm facial features. Thin strokes, consistent proportions.
 * Expression differs subtly per emotion but stays understated.
 */
function EmotionFace({ emotion }: { emotion: EmotionType }) {
  const eyeProps = {
    cx: 0,
    cy: 0,
    rx: 3.2,
    ry: 4.4,
    fill: '#FFFFFF',
  };
  const leftEye = { ...eyeProps, x: 38 };
  const rightEye = { ...eyeProps, x: 62 };

  // Mouth path per emotion (centered around y≈62).
  const mouths: Record<EmotionType, string> = {
    great: 'M40 60 Q50 70 60 60', // broad happy smile
    good: 'M41 61 Q50 68 59 61', // gentle smile
    calm: 'M42 62 Q50 66 58 62', // soft content curve
    notGood: 'M41 66 Q50 60 59 66', // slight frown
    overwhelmed: 'M44 63 Q50 67 56 63', // small, open, uncertain
  };

  // Open-mouth fill for "overwhelmed" for a slightly flushed look.
  const openMouth = emotion === 'overwhelmed';

  return (
    <G>
      <Ellipse {...leftEye} cx={38} />
      <Ellipse {...rightEye} cx={62} />
      {openMouth ? (
        <Ellipse cx={50} cy={64} rx={4} ry={3.4} fill="#FFFFFF" opacity={0.9} />
      ) : (
        <Path
          d={mouths[emotion]}
          stroke="#FFFFFF"
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
        />
      )}
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

/**
 * Small themed sparkle mark (replacement for the Unicode ✨ in the UI).
 * Uses the brand ramp so it stays on-brand in Light/Dark.
 */
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
