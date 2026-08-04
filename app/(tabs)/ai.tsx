/**
 * Jouspace — AI Tab
 *
 * AI-native reflection companion. Repurposes the modular ChatScreen as the
 * dedicated AI surface referenced from the new bottom navigation.
 */

import React from 'react';
import { ChatScreen } from '@/features/chat';

export default function AIRoute() {
  return <ChatScreen />;
}
