/**
 * Profile Feature — Screen Hook
 *
 * Encapsulates all profile screen state and business logic.
 * The screen component is a pure render function of this hook's return value.
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/core/store/useAppStore';

export function useProfileScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.session.user);
  const logout = useAppStore((state) => state.logout);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);

  const [signingOut, setSigningOut] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const handleOpenEdit = useCallback(() => {
    setEditName(user?.name || '');
    setEditModalVisible(true);
  }, [user]);

  const handleSaveProfile = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Display name cannot be empty.');
      return;
    }
    setUpdatingProfile(true);
    try {
      await updateUserProfile({ name: editName.trim() });
      setEditModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  }, [editName, updateUserProfile]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await logout();
            router.replace('/');
          } catch {
            setSigningOut(false);
          }
        },
      },
    ]);
  }, [logout, router]);

  return {
    user,
    streakDays: user?.stats?.streakDays ?? 0,
    totalSessions: user?.stats?.totalSessions ?? 0,
    totalMinutes: user?.stats?.totalMinutes ?? 0,
    signingOut,
    editModalVisible,
    editName,
    updatingProfile,
    handleOpenEdit,
    handleSaveProfile,
    handleSignOut,
    setEditName,
    setEditModalVisible,
  };
}
