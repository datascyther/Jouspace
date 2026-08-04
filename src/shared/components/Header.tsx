/**
 * Header — Screen header with title, subtitle, and optional actions
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  className = '',
}: HeaderProps) {
  const { colors } = useTheme();
  return (
    <View className={`flex-row items-center justify-between pt-4 pb-6 px-5 ${className}`}>
      <View className="flex-row items-center flex-1">
        {leftAction && <View className="mr-3">{leftAction}</View>}
        <View className="flex-1">
          <Text
            className="text-label font-medium"
            style={{ color: colors.text.secondary }}
          >
            {subtitle}
          </Text>
          <Text
            className="text-card-title font-semibold mt-0.5"
            style={{ color: colors.text.primary }}
          >
            {title}
          </Text>
        </View>
      </View>
      {rightAction && <View className="ml-4">{rightAction}</View>}
    </View>
  );
}

export default Header;
