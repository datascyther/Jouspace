import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/hooks/useTheme';
import type { Edge } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  className?: string;
  edges?: Edge[];
}

export function ScreenContainer({
  children,
  className = '',
  edges = ['top'],
}: ScreenContainerProps) {
  const { colors, theme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
      edges={edges}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.content} className={className}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenContainer;
