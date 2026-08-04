import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, BellOff, MessageCircle, Heart, Trophy } from 'lucide-react-native';
import { useAppStore } from '@/core/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const user = useAppStore((state) => state.session.user);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);

  const initialPushEnabled = user?.preferences?.notifications ?? false;

  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [dailyReminder, setDailyReminder] = useState(user?.reminderPreference ? true : false);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [milestoneAlerts, setMilestoneAlerts] = useState(true);

  const handleTogglePush = useCallback(async (value: boolean) => {
    setPushEnabled(value);
    try {
      const updatedPrefs = {
        theme: user?.preferences?.theme || 'auto',
        notifications: value,
        language: user?.preferences?.language || 'en',
        tone: user?.preferences?.tone || 'auto',
      };
      await updateUserProfile({ preferences: updatedPrefs });
    } catch (e) {
      Alert.alert('Error', 'Failed to update notification preferences.');
    }
  }, [user, updateUserProfile]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.default }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Notifications</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Push Notifications
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
          <NotificationRow
            icon={pushEnabled ? Bell : BellOff}
            iconColor={pushEnabled ? colors.brand.primary : colors.text.secondary}
            label="Enable Push Notifications"
            description="Receive alerts and updates"
            value={pushEnabled}
            onValueChange={handleTogglePush}
            colors={colors}
          />
          <NotificationRow
            icon={Heart}
            iconColor="#EF4444"
            label="Daily Reminder"
            description="Gentle nudge to check in each day"
            value={dailyReminder}
            onValueChange={setDailyReminder}
            colors={colors}
          />
          <NotificationRow
            icon={MessageCircle}
            iconColor="#06B6D4"
            label="Message Alerts"
            description="New group chat messages"
            value={messageAlerts}
            onValueChange={setMessageAlerts}
            colors={colors}
          />
          <NotificationRow
            icon={Trophy}
            iconColor="#F59E0B"
            label="Milestone Alerts"
            description="Streaks, achievements, and progress"
            value={milestoneAlerts}
            onValueChange={setMilestoneAlerts}
            colors={colors}
            isLast
          />
        </View>

        <Text style={[styles.hintText, { color: colors.text.secondary }]}>
          Push notification support requires configuring Expo Notifications and storing push tokens in your profile. Enable this feature to receive real-time alerts.
        </Text>

        {!pushEnabled && (
          <View style={[styles.disabledAlert, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
            <Text style={[styles.disabledAlertText, { color: colors.text.secondary }]}>
              Notifications are currently disabled. Toggle "Enable Push Notifications" above to configure your preferences.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface NotificationRowProps {
  icon: any;
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: any;
  isLast?: boolean;
}

function NotificationRow({
  icon: Icon,
  iconColor,
  label,
  description,
  value,
  onValueChange,
  colors,
  isLast,
}: NotificationRowProps) {
  return (
    <View style={[styles.rowContainer, { borderBottomColor: colors.border.default }, isLast ? styles.noBorder : null]}>
      <View style={[styles.iconWrapper, { backgroundColor: iconColor + '15' }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.rowTextWrapper}>
        <Text style={[styles.rowLabel, { color: colors.text.primary }]}>{label}</Text>
        <Text style={[styles.rowDescription, { color: colors.text.secondary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border.default, true: colors.brand.primary + '80' }}
        thumbColor={value ? colors.brand.primary : colors.text.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTextWrapper: {
    flex: 1,
    marginRight: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  hintText: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 18,
  },
  disabledAlert: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  disabledAlertText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
