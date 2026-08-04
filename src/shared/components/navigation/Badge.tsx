import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigationContext } from './NavigationContext';

interface BadgeProps {
  count?: number;
}

export function Badge({ count = 0 }: BadgeProps) {
  const { colors, theme } = useNavigationContext();

  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();
  const borderStrokeColor = theme === 'dark' ? 'rgba(26, 20, 40, 0.92)' : '#FFFFFF';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.danger,
          borderColor: borderStrokeColor,
        },
      ]}
    >
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default Badge;
