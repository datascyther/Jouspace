import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform, ActionSheetIOS } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/core/theme/tokens';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

export interface Action {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface MessageActionSheetProps {
  visible: boolean;
  onClose: () => void;
  actions: Action[];
}

export function MessageActionSheet({ visible, onClose, actions }: MessageActionSheetProps) {
  const { colors } = useTheme();
  const actionsRef = useRef(actions);
  const onCloseRef = useRef(onClose);
  actionsRef.current = actions;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (Platform.OS !== 'ios' || !visible) return;

    const currentActions = actionsRef.current;
    const currentOnClose = onCloseRef.current;

    const options = [...currentActions.map(a => a.label), 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = currentActions.findIndex(a => a.destructive);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
      },
      (buttonIndex) => {
        if (buttonIndex === cancelButtonIndex) {
          currentOnClose();
          return;
        }
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
        currentActions[buttonIndex].onPress();
        currentOnClose();
      }
    );
  }, [visible]);

  if (Platform.OS === 'ios') return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop animation */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.overlay.medium }]}
        >
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>

        {/* Sheet animation */}
        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { backgroundColor: colors.surface.primary, borderTopColor: colors.border.default, shadowColor: colors.brand.primaryDeep }]}
        >
          {/* Top handle pill for premium look */}
          <View style={[styles.sheetHandle, { backgroundColor: colors.border.strong }]} />

          <View style={styles.actionsContainer}>
            {actions.map((action, index) => {
              const isLastAction = index === actions.length - 1;
              return (
                <View key={index}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionRow,
                      pressed && { backgroundColor: colors.surface.secondary },
                    ]}
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                      action.onPress();
                      onClose();
                    }}
                    accessibilityRole="menuitem"
                  >
                    {action.icon && <View style={styles.iconContainer}>{action.icon}</View>}
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: action.destructive ? colors.danger : colors.text.primary },
                        action.destructive && { fontWeight: '600' },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                  {!isLastAction && (
                    <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
                  )}
                </View>
              );
            })}
          </View>

          <View style={[styles.cancelSeparator, { backgroundColor: colors.border.default }]} />

          <Pressable
            style={({ pressed }) => [
              styles.cancelRow,
              { backgroundColor: colors.surface.secondary },
              pressed && { opacity: 0.8 },
            ]}
            onPress={onClose}
            accessibilityRole="menuitem"
            accessibilityLabel="Cancel"
          >
            <Text style={[styles.cancelLabel, { color: colors.text.primary }]}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: borderRadius['glass-lg'] || 24,
    borderTopRightRadius: borderRadius['glass-lg'] || 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? spacing.xl : spacing['2xl'],
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1.5,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4.5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.4,
  },
  actionsContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
  },
  actionLabel: {
    fontSize: 15.5,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  rowDivider: {
    height: 1,
    width: '100%',
  },
  cancelSeparator: {
    height: 1,
    marginVertical: 12,
  },
  cancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: borderRadius.lg,
    marginTop: 4,
  },
  cancelLabel: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

export default MessageActionSheet;
