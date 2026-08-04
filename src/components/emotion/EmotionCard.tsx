import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { EmotionAvatar } from './EmotionAvatar';
import { EMOTION_COLORS, type EmotionType } from '@/constants/emotions';

export interface EmotionCardProps {
  emotion: EmotionType;
  size?: number;
  showLabel?: boolean;
  onPress?: () => void;
  selected?: boolean;
}

export function EmotionCard({
  emotion,
  size = 48,
  showLabel = true,
  onPress,
  selected = false,
}: EmotionCardProps) {
  const { colors } = useTheme();
  const palette = EMOTION_COLORS[emotion];
  const bgColor = selected ? `${palette.glow}22` : colors.surface.secondary;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderColor: selected ? palette.glow : colors.border.default,
        },
      ]}
    >
      <EmotionAvatar
        emotion={emotion}
        size={size}
        animated
        selected={selected}
        showGlow={false}
        showLabel={false}
      />
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: selected ? palette.glow : colors.text.secondary,
            },
          ]}
        >
          {palette.label}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${palette.label}${selected ? ', selected' : ''}`}
        accessibilityState={{ selected }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minWidth: 64,
    minHeight: 80,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default EmotionCard;
