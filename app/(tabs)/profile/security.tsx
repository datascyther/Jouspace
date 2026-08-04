import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Key, Download, FileText, Mail, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function SecurityScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const handleAction = useCallback((label: string) => {
    Alert.alert(label, `You selected the "${label}" action.`);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.default }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Privacy & Security</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Security Section */}
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Security
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
          <SecurityRow
            icon={Key}
            iconColor="#8B5CF6"
            label="Change Password"
            description="Update your account password"
            onPress={() => handleAction('Change Password')}
            colors={colors}
          />
          <SecurityRow
            icon={Mail}
            iconColor="#06B6D4"
            label="Email Verification"
            description="Manage your verified email"
            onPress={() => handleAction('Email Verification')}
            colors={colors}
            isLast
          />
        </View>

        {/* Data Section */}
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Data & Privacy
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
          <SecurityRow
            icon={Download}
            iconColor="#10B981"
            label="Export My Data"
            description="Download a copy of your data"
            onPress={() => handleAction('Export My Data')}
            colors={colors}
          />
          <SecurityRow
            icon={FileText}
            iconColor="#F59E0B"
            label="Privacy Policy"
            description="How we handle your data"
            onPress={() => handleAction('Privacy Policy')}
            colors={colors}
          />
          <SecurityRow
            icon={Shield}
            iconColor="#6C4CF1"
            label="Terms of Service"
            description="Platform terms and conditions"
            onPress={() => handleAction('Terms of Service')}
            colors={colors}
            isLast
          />
        </View>

        {/* Encrypted Disclaimer Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
          <Shield size={22} color={colors.brand.primary} style={styles.infoIcon} />
          <Text style={[styles.infoText, { color: colors.text.secondary }]}>
            Your data is encrypted in transit and at rest. We use industry-standard security practices to protect your information. For account deletion or data requests, contact our support team.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SecurityRowProps {
  icon: any;
  iconColor: string;
  label: string;
  description: string;
  onPress: () => void;
  colors: any;
  isLast?: boolean;
}

function SecurityRow({
  icon: Icon,
  iconColor,
  label,
  description,
  onPress,
  colors,
  isLast,
}: SecurityRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.rowContainer,
        { borderBottomColor: colors.border.default },
        isLast ? styles.noBorder : null
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconColor + '15' }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.rowTextWrapper}>
        <Text style={[styles.rowLabel, { color: colors.text.primary }]}>{label}</Text>
        <Text style={[styles.rowDescription, { color: colors.text.secondary }]}>{description}</Text>
      </View>
      <ChevronRight size={18} color={colors.text.secondary} />
    </TouchableOpacity>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 28,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
