import React, { useMemo } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { NavigationContext, TabName } from './NavigationContext';
import NavigationContainer from './NavigationContainer';
import NavigationItem from './NavigationItem';
import { spacing } from '@/core/theme';

const TAB_CONFIGS: Record<TabName, { label: string; hint: string }> = {
  home: { label: 'Home', hint: 'Navigates to the Home dashboard' },
  journal: { label: 'Journal', hint: 'Opens your journaling space' },
  memory: { label: 'Memory', hint: 'Opens your memory patterns' },
  ai: { label: 'AI', hint: 'Opens your AI companion' },
};

const ORDER: TabName[] = ['home', 'journal', 'memory', 'ai'];
const WRITE_INSERT_INDEX = 2;

const mapRouteToTab = (routeName: string): TabName => {
  if (routeName === 'index') return 'home';
  return routeName as TabName;
};

export function BottomNavigation({ state, navigation }: BottomTabBarProps) {
  const { theme, colors } = useTheme();
  const router = useRouter();

  const activeRoute = state.routes[state.index];
  const activeTabName = mapRouteToTab(activeRoute.name);

  const handleTabPress = (tabName: TabName) => {
    const targetRoute = state.routes.find((r) => mapRouteToTab(r.name) === tabName);
    if (!targetRoute) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate(targetRoute.name);
  };

  const handleWritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/(tabs)/journal/new');
  };

  const contextValue = useMemo(() => ({
    activeTab: activeTabName,
    disabledTabs: [] as TabName[],
    badges: {} as Partial<Record<TabName, number>>,
    theme,
    colors,
    onTabPress: handleTabPress,
  }), [activeTabName, theme, colors]);

  return (
    <NavigationContext.Provider value={contextValue}>
      <NavigationContainer>
        {ORDER.map((tabName, idx) => {
          const items: React.ReactNode[] = [];
          if (idx === WRITE_INSERT_INDEX) {
            items.push(
              <Pressable
                key="write-fab"
                onPress={handleWritePress}
                style={({ pressed }) => [
                  styles.writeFab,
                  { backgroundColor: colors.brand.primary },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Pencil size={24} color={colors.brand.onPrimary} />
              </Pressable>
            );
          }
          items.push(<NavigationItem key={tabName} name={tabName} label={TAB_CONFIGS[tabName].label} hint={TAB_CONFIGS[tabName].hint} />);
          return <React.Fragment key={tabName}>{items}</React.Fragment>;
        })}
      </NavigationContainer>
    </NavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  writeFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6D4FD7',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
    flexShrink: 0,
    shadowColor: '#6D4FD7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 5,
  },
});

export default BottomNavigation;
