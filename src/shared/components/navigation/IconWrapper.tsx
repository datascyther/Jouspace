import React from 'react';
import { View } from 'react-native';
import { Home, BookText, Layers, Sparkles } from 'lucide-react-native';
import { TabName, useNavigationContext } from './NavigationContext';

interface IconWrapperProps {
  name: TabName;
  isActive: boolean;
  isPressed: boolean;
  isDisabled: boolean;
  size?: number;
}

export function IconWrapper({
  name,
  isActive,
  isPressed,
  isDisabled,
  size = 22,
}: IconWrapperProps) {
  const { colors } = useNavigationContext();

  let iconColor: string;
  if (isDisabled) iconColor = colors.text.disabled;
  else if (isActive) iconColor = colors.brand.primary;
  else iconColor = colors.text.secondary;

  const renderIcon = () => {
    switch (name) {
      case 'home': return <Home size={size} color={iconColor} />;
      case 'journal': return <BookText size={size} color={iconColor} />;
      case 'memory': return <Layers size={size} color={iconColor} />;
      case 'ai': return <Sparkles size={size} color={iconColor} />;
      default: return <Home size={size} color={iconColor} />;
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {renderIcon()}
    </View>
  );
}

export default IconWrapper;
