import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography, spacing } from '@/core/theme';

export interface GreetingBlockProps {
  /** Greeting phrase, e.g. "Good afternoon". Defaults to target copy. */
  greeting?: string;
  name: string | null;
  subtitle: string;
  testID?: string;
}

export function GreetingBlock({
  greeting = 'Good afternoon',
  name,
  subtitle,
  testID,
}: GreetingBlockProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  const headline = name ? `${greeting}, ${name}` : greeting;
  const headlineSize = isSmall ? 34 : 38;

  return (
    <View style={styles.container} testID={testID}>
      <Text
        style={[
          styles.headline,
          { color: colors.text.primary, fontSize: headlineSize },
        ]}
      >
        {headline}
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // headerToGreeting
    marginTop: spacing.section,
  },
  headline: {
    fontWeight: '500',
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.5,
    lineHeight: 46,
    color: '#0D102B',
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '400',
    fontFamily: typography.fontFamily.sans,
    marginTop: 8,
    lineHeight: 24,
    color: '#68677E',
  },
});

export default GreetingBlock;
