import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ThemeStatusBar } from '@/shared/components/ThemeStatusBar';
import { spacing } from '@/core/theme';

interface AppScreenProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  isOffline?: boolean;
  offlineMessage?: string;
}

const LARGE_SCREEN_WIDTH = 430;
const MAX_CONTENT_WIDTH = 540;
const SMALL_SCREEN_WIDTH = 360;

/**
 * Home screen shell: status bar + scroll + refresh + offline banner + spacing.
 * Keeps the Status Bar present and unobtrusive, centers content on large
 * screens, and tightens padding on small screens — all without layout shift.
 */
export function AppScreen({
  children,
  refreshing = false,
  onRefresh,
  isOffline = false,
  offlineMessage,
}: AppScreenProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const isSmall = width < SMALL_SCREEN_WIDTH;
  const isLarge = width >= LARGE_SCREEN_WIDTH;

  const horizontalPadding = isSmall ? 18 : spacing['2xl'];
  const contentMaxWidth = isLarge ? MAX_CONTENT_WIDTH : undefined;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
      edges={['top']}
    >
      <ThemeStatusBar />
      {isOffline && (
        <View
          style={[styles.offlineBanner, { backgroundColor: colors.brand.subtle }]}
          accessibilityRole="alert"
        >
          <View style={[styles.offlineDot, { backgroundColor: colors.brand.primary }]} />
          <Text style={[styles.offlineText, { color: colors.text.secondary }]}>
            {offlineMessage ?? 'You are offline. Some features may be unavailable.'}
          </Text>
        </View>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? 'center' : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {children}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 110,
  },
  bottomSpacer: {
    height: 20,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  offlineText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});
