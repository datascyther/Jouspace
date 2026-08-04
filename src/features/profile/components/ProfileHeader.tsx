/**
 * Profile Feature — Header Component
 *
 * Displays user avatar, name, email, and edit button.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import { Avatar } from '@/shared/components/Avatar';
import { IconButton } from '@/shared/components/IconButton';
import { spacing, typography } from '@/core/theme/tokens';
import { useTheme } from '@/hooks/useTheme';
import type { UserProfile } from '@/services/auth/types';

interface ProfileHeaderProps {
  user: UserProfile | null;
  onEditPress: () => void;
}

export const ProfileHeader = React.memo(function ProfileHeader({
  user,
  onEditPress,
}: ProfileHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Avatar photoURL={user?.photoURL} name={user?.name || 'Guest User'} size="xl" />
        <View style={styles.editBadge}>
          <IconButton
            icon={<Edit2 size={12} color={colors.brand.contrastText} />}
            variant="primary"
            size="sm"
            onPress={onEditPress}
          />
        </View>
      </View>
      <Text style={[styles.name, { color: colors.text.primary }]}>
        {user?.name || 'Guest User'}
      </Text>
      <Text style={[styles.email, { color: colors.text.secondary }]}>
        {user?.email || 'Manage your account'}
      </Text>
    </View>
  );
});

const styles = {
  container: {
    alignItems: 'center' as const,
    marginBottom: spacing['2xl'],
    paddingVertical: spacing.sm,
  },
  avatarWrapper: {
    position: 'relative' as const,
    marginBottom: spacing.lg,
  },
  editBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: -4,
  },
  name: {
    fontSize: typography.fontSize['card-title'],
    fontWeight: typography.fontWeight['card-title'],
    textAlign: 'center' as const,
    letterSpacing: typography.letterSpacing['section-title'],
  },
  email: {
    fontSize: typography.fontSize['body-sm'],
    marginTop: spacing.xs,
    textAlign: 'center' as const,
  },
};

export default ProfileHeader;
