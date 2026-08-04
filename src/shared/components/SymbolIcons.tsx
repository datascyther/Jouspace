/**
 * Jouspace — Symbol Icons
 *
 * Lightweight, on-brand SVG replacements for one-off Unicode emojis that
 * appear in production UI (notification bell, placeholder brain, streak
 * flame, "new" star). Brand-ramp tinted, theme-aware.
 */

import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

interface SymbolProps {
  size?: number;
  color?: string;
}

export function BellIcon({ size = 40, color }: SymbolProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.brand.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="bell-grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={stroke} />
          <Stop offset="100%" stopColor={colors.brand.secondary} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 3a5 5 0 0 0-5 5v3.5L5.5 15a1 1 0 0 0 .9 1.5h11.2a1 1 0 0 0 .9-1.5L17 11.5V8a5 5 0 0 0-5-5Z"
        fill="url(#bell-grad)"
      />
      <Path
        d="M9.5 18a2.5 2.5 0 0 0 5 0"
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BrainIcon({ size = 48, color }: SymbolProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.brand.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="brain-grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={stroke} />
          <Stop offset="100%" stopColor={colors.brand.secondary} />
        </LinearGradient>
      </Defs>
      <Path
        d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.2A3 3 0 0 0 8 19a3 3 0 0 0 4 1 3 3 0 0 0 4-1 3 3 0 0 0 3-6.8A3 3 0 0 0 18 7a3 3 0 0 0-3-3 2.6 2.6 0 0 0-3 1.4A2.6 2.6 0 0 0 9 4Z"
        fill="url(#brain-grad)"
        opacity={0.9}
      />
      <Path
        d="M12 5.5V18.5M9.5 8.5c1.2.8 2 1.8 2 3.8M14.5 8.5c-1.2.8-2 1.8-2 3.8"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.7}
      />
    </Svg>
  );
}

export function FlameIcon({ size = 20, color }: SymbolProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.brand.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="flame-grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor={stroke} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2.5c.6 3-1.8 4-1.8 6.5 0 1.2.8 2 1.8 2 1.2 0 2-1 2-2.4 2 1.3 3.5 3.4 3.5 6a6 6 0 1 1-12 0c0-3 2.2-5 3.7-6.6C9.9 6.6 11.4 4.6 12 2.5Z"
        fill="url(#flame-grad)"
      />
    </Svg>
  );
}

export function StarIcon({ size = 12, color }: SymbolProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.warning;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="star-grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FCD34D" />
          <Stop offset="100%" stopColor={stroke} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2.5l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 16.9 6.4 19.5l1.2-6.2L3 9l6.3-.8Z"
        fill="url(#star-grad)"
      />
    </Svg>
  );
}

export function NewBadge({ text, size = 10 }: { text: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={(text.length + 2) * size} height={size * 1.8} viewBox={`0 0 ${(text.length + 2) * 10} 18`}>
      <Defs>
        <LinearGradient id="new-grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FCD34D" />
          <Stop offset="100%" stopColor={colors.warning} />
        </LinearGradient>
      </Defs>
      <Circle cx={(text.length + 2) * 5} cy={9} r={9} fill="url(#new-grad)" />
    </Svg>
  );
}
