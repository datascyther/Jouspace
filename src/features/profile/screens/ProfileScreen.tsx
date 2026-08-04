/**
 * Profile Feature — Screen
 *
 * Orchestrator that composes all profile sub-components.
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { Header } from '@/shared/components/Header';
import { useProfileScreen } from '../hooks/useProfileScreen';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileStatsRow } from '../components/ProfileStatsRow';
import { ProfileMenuList } from '../components/ProfileMenuList';
import { SignOutButton } from '../components/SignOutButton';
import { EditProfileModal } from '../components/EditProfileModal';
import { TAB_BAR_CLEARANCE } from '../constants';
import { spacing } from '@/core/theme/tokens';

export function ProfileScreen() {
  const profile = useProfileScreen();
  const router = useRouter();

  const handleNavigate = useCallback((route: string) => {
    router.push(`/(tabs)/profile/${route}` as any);
  }, [router]);

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Profile" />

        <ProfileHeader
          user={profile.user}
          onEditPress={profile.handleOpenEdit}
        />

        <ProfileStatsRow
          streakDays={profile.streakDays}
          totalSessions={profile.totalSessions}
          totalMinutes={profile.totalMinutes}
        />

        <ProfileMenuList onNavigate={handleNavigate} />

        <SignOutButton
          onPress={profile.handleSignOut}
          loading={profile.signingOut}
        />
      </ScrollView>

      <EditProfileModal
        visible={profile.editModalVisible}
        onClose={() => profile.setEditModalVisible(false)}
        editName={profile.editName}
        onEditNameChange={profile.setEditName}
        onSave={profile.handleSaveProfile}
        updatingProfile={profile.updatingProfile}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
});

export default ProfileScreen;
