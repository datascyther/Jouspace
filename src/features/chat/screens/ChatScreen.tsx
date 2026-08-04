import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useDerivedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatHeader } from '../components/ChatHeader';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { useConversation } from '../conversation/useConversation';
import { saveDraft, loadSessionMeta } from '../persistence';
import { LAYOUT } from '@/shared/constants';
import { SessionContextProvider } from '../hooks/useSessionContext';
import { useKeyboardHeight, useKeyboardHeightShared } from '@/shared/hooks/useKeyboardHeight';
import { useAppStore } from '@/core/store/useAppStore';
import { ChatHistorySheet } from '../components/ChatHistorySheet';

export function ChatScreen() {
  return (
    <SessionContextProvider>
      <ChatScreenContent />
    </SessionContextProvider>
  );
}

function ChatScreenContent() {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { keyboardHeightSV } = useKeyboardHeightShared();
  const [pendingQuickStarter, setPendingQuickStarter] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const uid = useAppStore((state) => state.session.user?.uid ?? null);

  // Single animation source: `keyboardHeightSV` eases to the real keyboard
  // height whenever it changes (driven by `useKeyboardHeightShared`, which syncs
  // the withTiming to the keyboard event's own duration/easing and tracks
  // Gboard's mid-open height changes via change-frame events). Because it is a
  // reanimated SharedValue, everything derived from it below runs on the UI
  // thread and is applied by `ChatInput` through `useAnimatedStyle` — so the
  // composer *glides* with the IME instead of snapping.
  const keyboardAnim = keyboardHeightSV;

  // The global bottom tab bar (BottomNavigation) is a floating,
  // absolutely-positioned pill (NavigationContainer: bottom =
  // max(TAB_BAR_MARGIN, insets.bottom), height TAB_BAR_HEIGHT, zIndex 100)
  // that overlaps the bottom of every tab screen. Because ScreenContainer only
  // insets the top edge, the composer would otherwise render directly behind
  // the tab bar and appear "missing". So when the keyboard is CLOSED the
  // composer's bottom gap must clear the floating tab bar.
  const tabBarBottom = Math.max(LAYOUT.TAB_BAR_MARGIN, insets.bottom);
  // Resting clearance (keyboard hidden): lift the composer above the floating
  // tab bar plus a small breathing gap.
  const restClearance =
    tabBarBottom + LAYOUT.TAB_BAR_HEIGHT + LAYOUT.CHAT_KEYBOARD_GAP;

  // Open clearance (keyboard visible): the keyboard now covers the tab bar, so
  // the tab-bar clearance is no longer needed — the composer should sit just
  // above the IME with only a small breathing gap.
  //
  // IMPORTANT (the real Android bug): this app enables edge-to-edge
  // (`edgeToEdgeEnabled=true`, the Expo SDK 54 / Android 15 default). Under
  // edge-to-edge, `android:windowSoftInputMode="adjustResize"` is DISABLED by
  // the OS — the window no longer resizes when the IME appears
  // (see react-native-edge-to-edge "Keyboard management"; RN #49759). The two
  // previous fixes assumed the native resize lifted the composer and only added
  // a ~12px clearance on top, so on Android the bar never moved and looked
  // completely static. The `Keyboard` JS events still fire and report the real
  // IME height, so we must lift the composer by the FULL animated keyboard
  // height ourselves on Android — exactly like iOS.
  //
  // On Android under edge-to-edge, `endCoordinates.height` already spans from
  // the screen bottom to the top of the IME (it includes the nav-bar region the
  // app draws behind), so `kb + openGap` positions the composer just above the
  // keyboard without also adding `insets.bottom`.
  const openGap = LAYOUT.CHAT_KEYBOARD_GAP;

  // A single animated offset that interpolates smoothly between the resting
  // (tab-bar-clearing) state and the keyboard-open state as `keyboardAnim`
  // eases in/out. `progress` (0 → 1) is derived from the animated keyboard
  // height so the whole transition — including dropping the tab-bar clearance —
  // rides the same eased curve and never jumps. Both platforms now lift by the
  // full keyboard height because neither has a working native resize here
  // (iOS never resizes; Android's adjustResize is disabled by edge-to-edge).
  const composerOffset = useDerivedValue(() => {
    'worklet';
    const kb = keyboardAnim.value;
    // Normalize keyboard presence to 0..1. We cross-fade over the first 120px
    // of keyboard travel so the tab-bar clearance is released in lockstep with
    // the IME beginning to appear, then hold at the fully-open state.
    const progress = interpolate(kb, [0, 120], [0, 1], Extrapolation.CLAMP);

    // Lift the full keyboard height (plus a small gap) so the composer rides the
    // top edge of the IME on every platform and keyboard (Gboard included).
    const openOffset = kb + openGap;

    // Never dip below the resting clearance while the transition eases in.
    return Math.max(
      restClearance,
      interpolate(progress, [0, 1], [restClearance, openOffset])
    );
  }, [restClearance, openGap]);

  const { state, controller, isRestored } = useConversation();

  // Quick Actions "AI Chat" can pass an opening prompt via the `prefill` route
  // param (HomeScreen → router.push({ pathname: CHAT, params: { prefill } })).
  const params = useLocalSearchParams<{ prefill?: string }>();
  useEffect(() => {
    const prefill = typeof params.prefill === 'string' ? params.prefill : null;
    if (prefill) setPendingQuickStarter(prefill);
  }, [params.prefill]);

  const handleQuickStarterSelect = useCallback((text: string) => {
    setPendingQuickStarter(text);
  }, []);

  const handlePrefillSent = useCallback(() => {
    setPendingQuickStarter(null);
  }, []);

  const handleDraftChange = useCallback((text: string) => {
    if (state.conversationId) {
      saveDraft(state.conversationId, text);
    }
  }, [state.conversationId]);

  const inConversation = state.messages.length > 0;
  const sessionStartedAt = inConversation ? state.messages[0].createdAt : undefined;

  return (
    <ScreenContainer>
      <View style={styles.keyboardAvoid}>
        <ChatHeader
          title="Jouspace"
          showBackButton={inConversation}
          onBackPress={controller.clear}
          inConversation={inConversation}
          sessionStartedAt={sessionStartedAt}
          onHistoryPress={uid ? () => setHistoryOpen(true) : undefined}
        />

        <MessageList
          state={state}
          onRefresh={controller.refresh}
          onQuickStarterSelect={handleQuickStarterSelect}
          onRetry={controller.retry}
          onDismiss={controller.dismissMessage}
          isRestored={isRestored}
          onDelete={controller.deleteMessage}
          onRegenerate={controller.regenerate}
          keyboardHeight={keyboardHeight}
        />

        <ChatInput
          onSend={controller.sendMessage}
          onAbort={controller.abort}
          isStreaming={state.status === 'streaming'}
          paddingBottom={composerOffset}
          prefillText={pendingQuickStarter}
          onPrefillSent={handlePrefillSent}
          conversationId={state.conversationId}
          onDraftChange={handleDraftChange}
        />
        <ChatHistorySheet
          visible={historyOpen}
          onClose={() => setHistoryOpen(false)}
          uid={uid}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
});

export default ChatScreen;
