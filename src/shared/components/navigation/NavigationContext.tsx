import React, { createContext, useContext } from 'react';
import type { ThemeTokens } from '@/theme';

export type TabName = 'home' | 'journal' | 'memory' | 'ai';

export interface NavigationContextType {
  activeTab: TabName;
  disabledTabs: TabName[];
  badges: Partial<Record<TabName, number>>;
  theme: 'light' | 'dark';
  colors: ThemeTokens;
  onTabPress: (tab: TabName) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}
