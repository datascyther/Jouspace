import React from 'react';
import Svg, { Circle, Ellipse, Path, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  size?: number;
  showGlow?: boolean;
}

export function NotGoodIllustration({ size = 100, showGlow = true }: Props) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.mood.notGood} stopOpacity={0.85} />
          <Stop offset="30%" stopColor={colors.mood.notGood} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={colors.mood.notGood} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={colors.mood.notGood} />
          <Stop offset="100%" stopColor={colors.mood.overwhelmed} />
        </LinearGradient>
      </Defs>
      {showGlow && <Circle cx="50" cy="50" r="48" fill="url(#glowGrad)" opacity={0.85} />}
      <Ellipse cx="50" cy="84" rx="26" ry="6" fill="#000000" opacity={0.06} />
      <Circle cx="50" cy="50" r="36" fill="url(#orbGrad)" />
      <Ellipse cx="40" cy="36" rx="14" ry="9" fill="#FFFFFF" opacity={0.18} />
      <Ellipse cx="38" cy="47" rx="3.2" ry="4.4" fill="#FFFFFF" />
      <Ellipse cx="62" cy="47" rx="3.2" ry="4.4" fill="#FFFFFF" />
      <Path d="M41 66 Q50 60 59 66" stroke="#FFFFFF" strokeWidth={2.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
