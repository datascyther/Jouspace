/**
 * BaseMessageBubble
 *
 * Wraps every message in a plain View.
 * User messages slide in from the right; assistant messages appear instantly.
 */

import React from 'react';
import type { ViewStyle, StyleProp } from 'react-native';
import { View } from 'react-native';

interface BaseMessageBubbleProps {
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  role?: 'assistant' | 'user';
}

export function BaseMessageBubble({ children, containerStyle }: BaseMessageBubbleProps) {
  return <View style={containerStyle}>{children}</View>;
}

export default BaseMessageBubble;
