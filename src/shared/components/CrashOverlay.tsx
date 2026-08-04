import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSyncExternalStore } from 'react';
import { clearFatalError, getFatalError, subscribeFatalError } from '@/core/crashReporter';
import { useTheme } from '@/hooks/useTheme';

export function CrashOverlay() {
  const err = useSyncExternalStore(subscribeFatalError, getFatalError, getFatalError);
  const { colors } = useTheme();

  if (!err) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background.primary,
        padding: 16,
        paddingTop: 48,
        zIndex: 9999,
      }}
    >
      <Text style={{ color: colors.danger, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
        Fatal error captured (auto-close cause)
      </Text>
      <Text style={{ color: colors.text.secondary, fontSize: 13, marginBottom: 4 }}>
        source: {err.source}
        {err.fatal ? ' • fatal' : ''}
      </Text>
      <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '600', marginBottom: 10 }}>
        {err.message}
      </Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text selectable style={{ color: colors.text.tertiary, fontSize: 11, lineHeight: 16 }}>
          {err.stack || 'No stack available.'}
        </Text>
      </ScrollView>
      <TouchableOpacity
        onPress={clearFatalError}
        style={{
          marginTop: 12,
          backgroundColor: colors.brand.primary,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.brand.onPrimary, fontWeight: '600' }}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}
