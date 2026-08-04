/**
 * Modal — Reusable modal overlay
 *
 * Uses Reanimated for smooth enter/exit transitions.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, Modal as RNModal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  className = '',
}: ModalProps) {
  const { colors } = useTheme();
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back()) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible, backdropOpacity, scale]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: backdropOpacity.value,
  }));

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={backdropStyle}
        className="flex-1 bg-overlay-strong justify-center items-center px-6"
      >
        <Pressable className="absolute inset-0" onPress={onClose} />

        <Animated.View
          style={contentStyle}
          className={`bg-surface-card border border-jouspace-glass-border rounded-glass-lg w-full max-w-sm ${className}`}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              {title ? (
                <Text className="text-text-primary text-card-title font-semibold">{title}</Text>
              ) : (
                <View />
              )}
              {showCloseButton && (
                <Pressable onPress={onClose} className="p-1">
                  <X size={20} color={colors.text.tertiary} />
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <View className="px-5 pb-5">{children}</View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

export default Modal;
