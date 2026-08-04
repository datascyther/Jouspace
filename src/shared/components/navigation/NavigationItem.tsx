import React, { useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TabName, useNavigationContext } from './NavigationContext';
import IconWrapper from './IconWrapper';
import Badge from './Badge';
import { typography } from '@/core/theme';

interface NavigationItemProps {
  name: TabName;
  label: string;
  hint: string;
}

export const NavigationItem = React.memo(function NavigationItem({
  name,
  label,
  hint,
}: NavigationItemProps) {
  const {
    activeTab,
    disabledTabs,
    badges,
    colors,
    onTabPress,
  } = useNavigationContext();

  const [isPressed, setIsPressed] = useState(false);

  const isActive = activeTab === name;
  const isDisabled = disabledTabs.includes(name);
  const badgeCount = badges[name] ?? 0;

  const handlePressIn = useCallback(() => {
    if (isDisabled) return;
    setIsPressed(true);
  }, [isDisabled]);

  const handlePressOut = useCallback(() => {
    if (isDisabled) return;
    setIsPressed(false);
  }, [isDisabled]);

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    onTabPress(name);
  }, [isDisabled, onTabPress, name]);

  let textColor: string;
  if (isDisabled) {
    textColor = colors.text.disabled;
  } else if (isActive) {
    textColor = colors.brand.primary;
  } else {
    textColor = colors.text.secondary;
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={styles.pressable}
    >
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <IconWrapper
            name={name}
            isActive={isActive}
            isPressed={isPressed}
            isDisabled={isDisabled}
          />
          <Badge count={badgeCount} />
        </View>
        <Text style={[styles.label, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
    letterSpacing: -0.1,
  },
});

export default NavigationItem;
