import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserDisplayName, useUser } from '@/shared/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/core/theme';

interface HomeHeaderProps {
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  unreadCount?: number;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'VU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function HomeHeader({
  onNotificationPress,
  onAvatarPress,
  unreadCount = 0,
}: HomeHeaderProps) {
  const displayName = useUserDisplayName();
  const user = useUser();
  const { colors } = useTheme();

  const initials = getInitials(displayName || user?.displayName || 'VU');

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      <View style={styles.brandLeft}>
        <View style={[styles.logoCircle, { backgroundColor: colors.brand.primary }]}>
          <Text style={[styles.logoText, { color: colors.brand.onPrimary }]}>J</Text>
        </View>
        <Text style={[styles.wordmark, { color: colors.text.primary }]}>
          Jouspace
        </Text>
      </View>

      <View style={styles.brandRight}>
        <Pressable
          onPress={onNotificationPress}
          hitSlop={12}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Bell size={22} color={colors.text.primary} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <View style={[styles.notificationDot, { backgroundColor: colors.danger }]} />
          )}
        </Pressable>

        <Pressable onPress={onAvatarPress} hitSlop={8}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.brand.tint }]}>
            <Text style={[styles.avatarText, { color: colors.text.primary }]}>
              {initials}
            </Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Compact header — safe area already applied by parent
    paddingTop: 4,
    minHeight: 44,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: typography.fontFamily.sans,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '500',
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.2,
  },
  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
});

export default HomeHeader;
