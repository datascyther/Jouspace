/**
 * Toast — Toast notification component
 *
 * Reads from the Zustand toast queue and renders active toasts.
 * Uses Reanimated for enter/exit animations.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { useAppStore } from '@/core/store/useAppStore';
import type { Toast as ToastType } from '@/core/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { shadows, motion, typography } from '@/core/theme';

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const toastColorMap = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
} as const;

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const Icon = toastIcons[toast.type];
  const { colors } = useTheme();
  const color = colors[toastColorMap[toast.type]];

  useEffect(() => {
    translateY.value = withSpring(0, motion.easing.spring);
    opacity.value = withTiming(1, { duration: 200 });

    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      translateY.value = withSequence(
        withTiming(-80, { duration: 200 }, () => {
          runOnJS(onDismiss)(toast.id);
        })
      );
      opacity.value = withTiming(0, { duration: 150 });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          backgroundColor: colors.surface.primary,
          borderWidth: 1,
          borderColor: colors.glass.border,
          borderRadius: 24,
          ...shadows.glass,
        },
      ]}
      className="rounded-glass-lg px-4 py-3.5 mx-4 mb-2 flex-row items-center"
    >
      <Icon size={20} color={color} />
      <Text
        style={{
          flex: 1,
          color: colors.text.primary,
          fontSize: typography.fontSize['body-sm'],
          lineHeight: typography.fontSize['body-sm'] * typography.lineHeight['body-sm'],
          marginLeft: 12,
        }}
      >
        {toast.message}
      </Text>
      <Pressable onPress={() => onDismiss(toast.id)} style={{ marginLeft: 8 }}>
        <X size={16} color={colors.text.tertiary} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useAppStore((state) => state.ui.toasts);
  const removeToast = useAppStore((state) => state.removeToast);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingTop: 8,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </View>
  );
}

export default ToastContainer;
