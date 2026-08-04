/**
 * Profile Feature — Menu List
 *
 * Renders the "Account & Preferences" section header and mapped menu items.
 */

import React, { useCallback } from 'react';
import { View } from 'react-native';
import { SectionHeader } from '@/shared/components/SectionHeader';
import { ProfileMenuItem } from './ProfileMenuItem';
import { PROFILE_MENU_ITEMS } from '../constants';
import { spacing } from '@/core/theme/tokens';

interface ProfileMenuListProps {
  onNavigate: (route: string) => void;
}

export const ProfileMenuList = React.memo(function ProfileMenuList({
  onNavigate,
}: ProfileMenuListProps) {
  return (
    <View style={styles.container}>
      <SectionHeader title="Account & Preferences" style={styles.sectionHeader} />
      {PROFILE_MENU_ITEMS.map((item) => (
        <ProfileMenuItem
          key={item.route}
          icon={item.icon}
          title={item.title}
          description={item.description}
          accentColor={item.accentColor}
          onPress={() => onNavigate(item.route)}
        />
      ))}
    </View>
  );
});

const styles = {
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
};

export default ProfileMenuList;
