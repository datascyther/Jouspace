/**
 * BottomSheet — Slide-up panel from the bottom
 *
 * Uses Reanimated gesture handler for drag-to-dismiss.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, Modal as RNModal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // percentage of screen height, e.g. [50, 75]
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapPoints = [50],
}: BottomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const sheetHeight = (Math.max(...snapPoints) / 100) * SCREEN_HEIGHT;

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > sheetHeight * 0.3) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Animated.View style={backdropStyle} className="absolute inset-0 bg-overlay-strong">
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              sheetStyle,
              { maxHeight: SHEET_MAX_HEIGHT },
            ]}
            className="bg-surface-card border-t border-jouspace-glass-border rounded-t-2xl"
          >
            {/* Handle */}
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 rounded-full bg-jouspace-glass-border" />
            </View>

            {/* Header */}
            {title && (
              <View className="px-5 pb-3">
                <Text className="text-text-primary text-card-title font-semibold">{title}</Text>
              </View>
            )}

            {/* Content */}
            <View className="px-5 pb-6">{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </RNModal>
  );
}

export default BottomSheet;
