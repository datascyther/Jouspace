/**
 * Jouspace — Bubble Variants
 *
 * Defines the visual shape grammar for AI and user message bubbles.
 * Supports iMessage-style grouping: adjacent same-role messages
 * share a flattened corner on their shared edge, creating a visual
 * cluster. The first and last in each group retain a full radius.
 *
 * Usage:
 *   const style = getBubbleStyle('assistant', isGrouped, isFirst, isLast);
 */

import { chat } from '@/core/theme/tokens';

const R = chat.bubble.radius;   // 20
const G = chat.bubble.radiusGrouped; // 6

export type BubbleRole = 'assistant' | 'user';

export interface BubbleGroupPosition {
  isGrouped: boolean;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Returns the borderRadius style object for a bubble given its role
 * and position within a message group.
 *
 * AI bubbles sit on the LEFT — flattened top-left for non-first grouped messages.
 * User bubbles sit on the RIGHT — flattened top-right for non-first grouped messages.
 */
export function getBubbleRadius(role: BubbleRole, pos: BubbleGroupPosition) {
  const { isGrouped, isFirst, isLast } = pos;

  if (!isGrouped || isFirst) {
    // Standard fully-rounded radius
    return {
      borderTopLeftRadius: R,
      borderTopRightRadius: R,
      borderBottomLeftRadius: isLast ? R : G,
      borderBottomRightRadius: isLast ? R : (role === 'user' ? G : R),
    };
  }

  if (role === 'assistant') {
    return {
      borderTopLeftRadius: G,
      borderTopRightRadius: R,
      borderBottomLeftRadius: isLast ? R : G,
      borderBottomRightRadius: R,
    };
  }

  // user
  return {
    borderTopLeftRadius: R,
    borderTopRightRadius: G,
    borderBottomLeftRadius: R,
    borderBottomRightRadius: isLast ? R : G,
  };
}

/** Returns the vertical margin between bubbles based on group context. */
export function getBubbleMarginBottom(isGrouped: boolean): number {
  return isGrouped ? chat.group.innerGap : chat.group.outerGap;
}

// ─── Static shape config ─────────────────────────────────────────────────────

export const aiBubbleBase = {
  maxWidth: chat.bubble.maxWidthAI,
  paddingHorizontal: chat.bubble.paddingHAI,
  paddingVertical: chat.bubble.paddingVAI,
} as const;

export const userBubbleBase = {
  maxWidth: chat.bubble.maxWidthUser,
  paddingHorizontal: chat.bubble.paddingHUser,
  paddingVertical: chat.bubble.paddingVUser,
} as const;

// ─── Legacy exports (used by existing components during migration) ────────────

import type { ViewStyle, DimensionValue } from 'react-native';
import { spacing, borderRadius } from '@/core/theme/tokens';

interface BubbleContainerStyle {
  marginVertical?: number;
  marginBottom?: number;
  maxWidth?: DimensionValue;
  borderRadius?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  flexDirection?: ViewStyle['flexDirection'];
  justifyContent?: ViewStyle['justifyContent'];
  width?: DimensionValue;
}

interface BubbleWrapperStyle {
  flexDirection?: ViewStyle['flexDirection'];
  alignItems?: ViewStyle['alignItems'];
  maxWidth?: DimensionValue;
}

interface BubbleInnerStyle {
  borderRadius?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  shadowOffset?: ViewStyle['shadowOffset'];
  shadowOpacity?: ViewStyle['shadowOpacity'];
  shadowRadius?: ViewStyle['shadowRadius'];
  elevation?: ViewStyle['elevation'];
}

export interface BubbleVariant {
  container: BubbleContainerStyle;
  wrapper?: BubbleWrapperStyle;
  bubble?: BubbleInnerStyle;
}

export const aiBubble: BubbleVariant = {
  container: {
    marginBottom: spacing.sm,
    maxWidth: '88%',
    borderRadius: 20,
    paddingHorizontal: chat.bubble.paddingHAI,
    paddingVertical: chat.bubble.paddingVAI,
  },
};

export const userBubble: BubbleVariant = {
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
    width: '100%',
  },
  wrapper: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: chat.bubble.maxWidthUser,
  },
  bubble: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: chat.bubble.paddingHUser,
    paddingVertical: chat.bubble.paddingVUser,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
};
