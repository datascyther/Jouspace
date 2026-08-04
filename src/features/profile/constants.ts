/**
 * Profile Feature — Constants
 *
 * Static data, accent colors, and layout values for the profile screen.
 */

import { Bell, Shield, CreditCard, Settings, type LucideIcon } from 'lucide-react-native';
import { colors } from '@/core/theme/colors';
import { LAYOUT } from '@/shared/constants';

export interface ProfileMenuItemConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  route: string;
  accentColor: string;
}

export const MENU_ACCENT_COLORS = {
  notifications: colors.purple[500],
  security: colors.cyan[500],
  subscription: colors.purple[400],
  settings: colors.cyan[400],
} as const;

export const PROFILE_MENU_ITEMS: ProfileMenuItemConfig[] = [
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Manage alerts and reminders',
    route: 'notifications',
    accentColor: MENU_ACCENT_COLORS.notifications,
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Terms and data controls',
    route: 'security',
    accentColor: MENU_ACCENT_COLORS.security,
  },
  {
    icon: CreditCard,
    title: 'Subscription',
    description: 'View plan and membership details',
    route: 'subscription',
    accentColor: MENU_ACCENT_COLORS.subscription,
  },
  {
    icon: Settings,
    title: 'Settings',
    description: 'Theme and configuration preferences',
    route: 'settings',
    accentColor: MENU_ACCENT_COLORS.settings,
  },
];

export const TAB_BAR_CLEARANCE = LAYOUT.TAB_BAR_HEIGHT + LAYOUT.TAB_BAR_MARGIN + 24;
