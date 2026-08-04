import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, type NativeSyntheticEvent, type TextInputContentSizeChangeEventData } from 'react-native';
import { Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SendButton } from './SendButton';
import { saveDraft, loadDraft, clearDraft } from '../persistence/draftStorage';
import type { SharedValue } from 'react-native-reanimated';

const WARM_PLACEHOLDERS = [
  "Share what's on your mind...",
  "What's on your heart right now?",
  "Tell me how your day went...",
  "How can I support you today?",
] as const;

interface ChatInputProps {
  onSend: (text: string) => void;
  onAbort?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  paddingBottom?: number | SharedValue<number>;
  prefillText?: string | null;
  onPrefillSent?: () => void;
  conversationId?: string | null;
  onDraftChange?: (text: string) => void;
}

export function ChatInput({
  onSend,
  onAbort,
  isStreaming = false,
  disabled = false,
  paddingBottom = 0,
  prefillText,
  onPrefillSent,
  conversationId,
  onDraftChange,
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();

  const focusBorderColor = useSharedValue(colors.border.default);
  const focusShadowOpacity = useSharedValue(0.04);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Focus effect ---

  useEffect(() => {
    focusBorderColor.value = withTiming(
      isFocused ? colors.brand.primary : colors.border.default,
      { duration: 250 }
    );
    focusShadowOpacity.value = withTiming(
      isFocused ? 0.14 : 0.04,
      { duration: 250 }
    );
  }, [isFocused, colors]);

  const animatedWrapperStyle = useAnimatedStyle(() => ({
    borderColor: focusBorderColor.value,
    shadowOpacity: focusShadowOpacity.value,
  }));

  // --- Auto focus when streaming stops ---

  useEffect(() => {
    if (!isStreaming && !disabled) {
      inputRef.current?.focus();
    }
  }, [isStreaming, disabled]);

  // --- Prefill handling ---

  useEffect(() => {
    if (!prefillText) return;
    const trimmed = prefillText.trim();
    if (!trimmed) return;

    setInputText(trimmed);

    const timer = setTimeout(() => {
      onSend(trimmed);
      setInputText('');
      onPrefillSent?.();
    }, 600);

    return () => clearTimeout(timer);
  }, [prefillText, onSend, onPrefillSent]);

  // --- Draft persistence ---

  useEffect(() => {
    if (!conversationId) return;
    loadDraft(conversationId)
      .then((draft) => {
        if (draft) {
          setInputText(draft);
        }
      })
      .catch((err) => console.warn('[ChatInput] loadDraft failed:', err));
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!inputText.trim()) return;

    debounceTimerRef.current = setTimeout(() => {
      saveDraft(conversationId, inputText);
      onDraftChange?.(inputText);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputText, conversationId, onDraftChange]);

  const handleContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      setInputHeight(event.nativeEvent.contentSize.height);
    },
    []
  );

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    onSend(text);
    if (conversationId) {
      clearDraft(conversationId);
    }
    onDraftChange?.('');
    setInputText('');
  }, [inputText, onSend, conversationId, onDraftChange]);

  const handleAbort = useCallback(() => {
    onAbort?.();
  }, [onAbort]);

  const placeholder = isStreaming ? 'Jouspace is responding...' : WARM_PLACEHOLDERS[0];

  const paddingBottomValue =
    typeof paddingBottom === 'object' && paddingBottom !== null && 'value' in paddingBottom
      ? (paddingBottom as SharedValue<number>)
      : null;

  const outerStyle = useAnimatedStyle(() => {
    const pb = paddingBottomValue ? paddingBottomValue.value : (paddingBottom as number) ?? 0;
    return { paddingBottom: pb };
  }, [paddingBottomValue, paddingBottom]);

  return (
    <Animated.View
      style={[styles.outerContainer, outerStyle]}
    >
      <Animated.View
        style={[
          styles.inputWrapper,
          animatedWrapperStyle,
          {
            backgroundColor: colors.surface.primary,
            shadowColor: colors.brand.primaryDeep,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            { color: colors.text.primary },
            inputHeight > 0 && { height: Math.min(inputHeight, 150) },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={inputText}
          onChangeText={setInputText}
          onContentSizeChange={handleContentSizeChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          maxLength={1000}
          editable={!disabled && !isStreaming}
          accessibilityLabel="Chat input field"
        />

        {isStreaming ? (
          <Pressable
            onPress={handleAbort}
            style={({ pressed }) => [
              styles.abortButton,
              {
                backgroundColor: colors.brand.primary,
                opacity: pressed ? 0.8 : 1,
                shadowColor: colors.brand.primaryDeep,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Stop AI response"
          >
            <Square size={12} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
          </Pressable>
        ) : (
          <SendButton
            onPress={handleSend}
            disabled={inputText.trim() === ''}
          />
        )}
      </Animated.View>

      {inputText.length > 800 && (
        <Text
          style={[
            styles.charCounter,
            {
              color: inputText.length > 900
                ? colors.danger
                : colors.text.tertiary,
              opacity: inputText.length > 900 ? 1 : 0.7,
            },
          ]}
        >
          {inputText.length}/1000
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 52,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    paddingHorizontal: 8,
    paddingVertical: 8,
    maxHeight: 150,
    textAlignVertical: 'top',
    letterSpacing: 0.1,
  },
  abortButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  charCounter: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 6,
  },
});

export default ChatInput;
