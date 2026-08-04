import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

interface SendButtonProps {
  onPress: () => void;
  disabled?: boolean;
  visible?: boolean;
}

export function SendButton({ onPress, disabled = false, visible = true }: SendButtonProps) {
  const { isDark, colors } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    onPress();
  };

  // Brand-locked fill so the send button is ALWAYS clearly visible and can never
  // drift to white/invisible on either theme. The icon uses onPrimary for
  // guaranteed contrast on the brand fill.
  const SEND_BG_LIGHT = colors.brand.primaryDeep;
  const SEND_BG_DARK = colors.brand.primary;
  const SEND_ICON = colors.brand.onPrimary;

  const backgroundColor = isDark ? SEND_BG_DARK : SEND_BG_LIGHT;

  if (!visible) return null;

  return (
    <View
      style={[
        styles.sendWrapper,
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor,
          shadowColor: backgroundColor,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: 'transparent',
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d="m21.426 11.095-17-8A1 1 0 0 0 3.03 4.242l1.212 4.849L12 12l-7.758 2.909-1.212 4.849a.998.998 0 0 0 1.396 1.147l17-8a1 1 0 0 0 0-1.81z"
            fill={SEND_ICON}
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sendWrapper: {
    marginLeft: 8,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default SendButton;
