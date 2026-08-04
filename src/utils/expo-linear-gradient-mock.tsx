import React from 'react';
import { View, type ViewStyle } from 'react-native';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: ViewStyle;
  children?: React.ReactNode;
  [key: string]: unknown;
}

function toCssGradient(
  colors: string[],
  locations: number[] | undefined,
  start: { x: number; y: number },
  end: { x: number; y: number },
): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // Convert a screen-space direction (y-down) to a CSS gradient angle (deg,
  // clockwise from 12 o'clock). atan2(dx, -dy) matches RN's start→end line.
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;

  const stops = colors
    .map((color, i) => {
      const pos =
        locations && locations[i] != null
          ? locations[i] * 100
          : colors.length > 1
            ? (i / (colors.length - 1)) * 100
            : 0;
      return `${color} ${pos}%`;
    })
    .join(', ');

  return `linear-gradient(${angle}deg, ${stops})`;
}

function LinearGradientImpl(props: LinearGradientProps) {
  const {
    colors = ['transparent'],
    start = { x: 0, y: 0 },
    end = { x: 1, y: 1 },
    locations,
    style,
    children,
    ...rest
  } = props;

  const backgroundImage = toCssGradient(colors, locations, start, end);

  return (
    <View
      style={[style, { backgroundImage, backgroundColor: 'transparent' } as ViewStyle]}
      {...rest}
    >
      {children}
    </View>
  );
}

export const LinearGradient = LinearGradientImpl;
export default LinearGradientImpl;
