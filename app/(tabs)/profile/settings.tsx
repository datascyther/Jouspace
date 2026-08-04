import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Moon, Sun, Monitor, Volume2, Languages, Trash2, Check } from 'lucide-react-native';
import { useAppStore, type ThemeMode } from '@/core/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { speechSynthesisAvailable } from '@/services/speech/SpeechSynthesis';
import type { Tone } from '@/services/auth/types';

const themeOptions: { label: string; value: ThemeMode; icon: typeof Moon }[] = [
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Auto', value: 'auto', icon: Monitor },
];

const toneOptions: { label: string; value: Tone }[] = [
  { label: 'Warm', value: 'warm' },
  { label: 'Motivational', value: 'motivational' },
  { label: 'Soothing', value: 'soothing' },
  { label: 'Auto', value: 'auto' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, theme: activeTheme } = useTheme();
  
  const uiTheme = useAppStore((state) => state.ui.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const voiceEnabled = useAppStore((state) => state.ui.voiceEnabled);
  const setVoiceEnabled = useAppStore((state) => state.setVoiceEnabled);
  const user = useAppStore((state) => state.session.user);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);

  const currentTone = user?.preferences?.tone || 'auto';

  const handleSelectTone = useCallback(async (tone: Tone) => {
    try {
      const updatedPrefs = {
        theme: user?.preferences?.theme || 'auto',
        notifications: user?.preferences?.notifications ?? true,
        language: user?.preferences?.language || 'en',
        tone,
      };
      await updateUserProfile({ preferences: updatedPrefs });
    } catch (e) {
      Alert.alert('Error', 'Failed to update preferences.');
    }
  }, [user, updateUserProfile]);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled(!voiceEnabled);
  }, [voiceEnabled, setVoiceEnabled]);

  const renderVoiceToggle = useCallback(() => {
    if (!speechSynthesisAvailable) {
      return (
        <Text style={[styles.badgeText, { color: colors.text.secondary }]}>
          Unavailable
        </Text>
      );
    }
    return (
      <TouchableOpacity
        onPress={handleToggleVoice}
        activeOpacity={0.7}
        accessibilityRole="switch"
        accessibilityState={{ checked: voiceEnabled }}
        style={[
          styles.toggleTrack,
          { backgroundColor: voiceEnabled ? colors.brand.primary : colors.border.default },
        ]}
      >
        <View
          style={[
            styles.toggleKnob,
            { backgroundColor: '#FFFFFF', transform: [{ translateX: voiceEnabled ? 18 : 0 }] },
          ]}
        />
      </TouchableOpacity>
    );
  }, [voiceEnabled, speechSynthesisAvailable, colors, handleToggleVoice]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', 'Account deletion request submitted.');
            router.back();
          },
        },
      ]
    );
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.default }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Settings</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Appearance
        </Text>
        <View style={styles.themeSelectorRow}>
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = uiTheme === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                onPress={() => setTheme(opt.value)}
                style={[
                  styles.themeOptionCard,
                  {
                    backgroundColor: colors.surface.secondary,
                    borderColor: selected ? colors.brand.primary : colors.border.default,
                  }
                ]}
              >
                <Icon size={20} color={selected ? colors.brand.primary : colors.text.secondary} />
                <Text style={[styles.themeOptionLabel, { color: selected ? colors.brand.primary : colors.text.primary, fontWeight: selected ? '600' : '400' }]}>
                  {opt.label}
                </Text>
                {selected && <View style={[styles.selectedDot, { backgroundColor: colors.brand.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tone Section */}
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Communication Tone
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
          {toneOptions.map((opt, i) => {
            const selected = currentTone === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                onPress={() => handleSelectTone(opt.value)}
                style={[
                  styles.cardRow,
                  { borderBottomColor: colors.border.default },
                  i === toneOptions.length - 1 ? styles.noBorder : null
                ]}
              >
                <Volume2 size={18} color={selected ? colors.brand.primary : colors.text.secondary} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: colors.text.primary, fontWeight: selected ? '600' : '400' }]}>
                  {opt.label}
                </Text>
                {selected && <Check size={18} color={colors.brand.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.hintText, { color: colors.text.secondary }]}>
          Choose how your AI wellness companion speaks to you during chat sessions.
        </Text>

        {/* Voice Responses Section */}
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Voice Responses
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
          <View style={[styles.cardRow, styles.noBorder]}>
            <Volume2 size={18} color={colors.text.secondary} style={styles.rowIcon} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>
              Speak responses aloud
            </Text>
            {renderVoiceToggle()}
          </View>
        </View>
        <Text style={[styles.hintText, { color: colors.text.secondary }]}>
          When enabled, Jouspace reads new AI responses aloud. You can also tap the speaker icon on any message to replay it.
        </Text>

        {/* Language Section */}
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Language
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
          <View style={[styles.cardRow, styles.noBorder]}>
            <Languages size={18} color={colors.text.secondary} style={styles.rowIcon} />
            <Text style={[styles.rowText, { color: colors.text.primary }]}>English</Text>
            <Text style={[styles.badgeText, { color: colors.text.secondary }]}>Default</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Account Actions
        </Text>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
          style={[
            styles.deleteButton,
            {
              backgroundColor: colors.surface.secondary,
              borderColor: colors.danger + '40',
            }
          ]}
        >
          <Trash2 size={18} color={colors.danger} style={styles.rowIcon} />
          <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  themeOptionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  themeOptionLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  selectedDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
  },
  badgeText: {
    fontSize: 12,
  },
  hintText: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'flex-start',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
