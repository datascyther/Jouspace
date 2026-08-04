/**
 * Jouspace — Memory Tab
 *
 * Surfaces the patterns Jouspace has quietly noticed across your journal.
 * Minimal first version: calm, on-brand placeholder that will later be
 * powered by the memory/pattern discovery layer.
 */

import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, borderRadius } from '@/core/theme';

export default function MemoryRoute() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
      edges={['top']}
    >
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text.primary }]}>Memory</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Patterns Jouspace has noticed across your writing.
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface.secondary,
              borderColor: colors.border.default,
              borderRadius: borderRadius['2xl'],
            },
          ]}
        >
          <Text style={[styles.cardText, { color: colors.text.secondary }]}>
            As you write, Jouspace will quietly remember themes, rhythms, and
            moments worth returning to. Your memory timeline will appear here.
          </Text>
        </View>
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
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.section,
    paddingBottom: spacing.section,
  },
  title: {
    fontSize: typography.fontSize['page-title'],
    fontWeight: '500',
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.01,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontFamily: typography.fontFamily.sans,
    color: undefined,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSize.body * 1.5,
  },
  card: {
    borderWidth: 1,
    padding: spacing.xl,
  },
  cardText: {
    fontSize: typography.fontSize.body,
    fontFamily: typography.fontFamily.sans,
    lineHeight: typography.fontSize.body * 1.5,
  },
});
