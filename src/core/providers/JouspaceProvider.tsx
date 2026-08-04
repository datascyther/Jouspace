/**
 * Jouspace — Root Application Provider
 *
 * GestureHandlerRootView is required for Reanimated + gesture-driven UI.
 * Load order is guaranteed by project root index.js.
 */

import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthProvider';
import { queryClient } from '../queryClient';
import { ThemeProvider } from '@/providers/ThemeProvider';

interface JouspaceProviderProps {
  children: React.ReactNode;
}

export function JouspaceProvider({ children }: JouspaceProviderProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <View style={{ flex: 1 }}>{children}</View>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default JouspaceProvider;
