/**
 * Profile Feature — Stats Row
 *
 * Three stat cards showing streak, sessions, and minutes.
 * Each card uses GlassCard for the frosted glass aesthetic.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Flame, Award, Clock } from 'lucide-react-native';
import { GlassCard } from '@/shared/components/GlassCard';
import { spacing, typography } from '@/core/theme/tokens';
import { colors as themeColors } from '@/core/theme/colors';
import { useTheme } from '@/hooks/useTheme';

interface ProfileStatsRowProps {
  streakDays: number;
  totalSessions: number;
  totalMinutes: number;
}

export const ProfileStatsRow = React.memo(function ProfileStatsRow({
  streakDays,
  totalSessions,
  totalMinutes,
}: ProfileStatsRowProps) {
  const { colors } = useTheme();

  const stats = [
    { icon: Flame, value: streakDays, label: 'Streak', iconColor: themeColors.purple[600] },
    { icon: Award, value: totalSessions, label: 'Sessions', iconColor: themeColors.cyan[500] },
    { icon: Clock, value: totalMinutes, label: 'Minutes', iconColor: themeColors.purple[400] },
  ];

  return (
    <View style={styles.row}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <GlassCard key={stat.label} style={styles.card}>
            <Icon size={20} color={stat.iconColor} />
            <Text style={[styles.value, { color: colors.text.primary }]}>
              {stat.value}
            </Text>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              {stat.label}
            </Text>
          </GlassCard>
        );
      })}
    </View>
  );
});

const styles = {
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing['2xl'],
  },
  card: {
    flex: 1,
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center' as const,
  },
  value: {
    fontSize: typography.fontSize['body-lg'],
    fontWeight: typography.fontWeight['card-title'],
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  label: {
    fontSize: typography.fontSize.label,
  },
};

export default ProfileStatsRow;
