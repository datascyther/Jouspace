/**
 * Profile Feature — Menu Item
 *
 * Single interactive menu row using GlassCard for frosted glass look.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { GlassCard } from '@/shared/components/GlassCard';
import { spacing, typography } from '@/core/theme/tokens';
import { useTheme } from '@/hooks/useTheme';

interface ProfileMenuItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor: string;
  onPress: () => void;
}

export const ProfileMenuItem = React.memo(function ProfileMenuItem({
  icon: Icon,
  title,
  description,
  accentColor,
  onPress,
}: ProfileMenuItemProps) {
  const { colors } = useTheme();

  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
        <Icon size={20} color={accentColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.text.secondary }]}>{description}</Text>
      </View>
      <ChevronRight size={18} color={colors.text.secondary} style={styles.chevron} />
    </GlassCard>
  );
});

const styles = {
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: '600' as const,
  },
  description: {
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
};

export default ProfileMenuItem;
