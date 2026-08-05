import React, { useState, useEffect, useRef } from 'react';
import { AIHeader } from './AIHeader';
import { MemoryContextCard } from './MemoryContextCard';
import { SuggestionRow } from './SuggestionRow';
import {
  UserMessageBubble,
  AssistantMessageBubble,
} from './MessageBubbles';
import { Composer } from './Composer';
import { BottomNavigation, NavTab } from './BottomNavigation';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  citationCount?: number;
  citationDates?: string[];
}

export const DEFAULT_SUGGESTIONS: string[] = [
  'Why do I keep returning to clarity?',
  'Show me what changed this month.',
  'Help me continue my last entry.',
];

export const DEFAULT_CONVERSATION: AIMessage[] = [
  {
    id: 'msg-user-1',
    role: 'user',
    text: 'What am I circling around lately?',
    timestamp: '9:41 AM',
  },
  {
    id: 'msg-assistant-1',
    role: 'assistant',
    text: 'You seem to be circling around consistency. It appears most often when you write after a gap.',
    citationCount: 3,
    citationDates: ['Aug 1', 'Jul 29', 'Jul 24'],
  },
];

interface AIScreenContentProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userInitials?: string;
  isLoading?: boolean;
  isThinking?: boolean;
  isStreaming?: boolean;
  isNoMemoryContext?: boolean;
  isNoConversation?: boolean;
  isComposerFocused?: boolean;
  isKeyboardOpen?: boolean;
  onToast?: (msg: string) => void;
}

export const AIScreenContent: React.FC<AIScreenContentProps> = ({
  activeTab,
  onTabChange,
  userInitials = 'VU',
  isLoading = false,
  isThinking = false,
  isStreaming = false,
  isNoMemoryContext = false,
  isNoConversation = false,
  isComposerFocused = false,
  isKeyboardOpen = false,
  onToast,
}) => {
  const [composerValue, setComposerValue] = useState('');
  const [focused, setFocused] = useState(isComposerFocused);
  const [messages, setMessages] = useState<AIMessage[]>(
    isNoConversation ? [] : DEFAULT_CONVERSATION
  );
  const [thinking, setThinking] = useState(isThinking);
  const [streamedText, setStreamedText] = useState<string | null>(null);
  const streamTimer = useRef<number | null>(null);

  // Streaming state demo: progressively reveal assistant response text
  useEffect(() => {
    if (!isStreaming) {
      setStreamedText(null);
      return;
    }
    const full = DEFAULT_CONVERSATION[1].text;
    let i = 0;
    setStreamedText('');
    streamTimer.current = window.setInterval(() => {
      i += 2;
      setStreamedText(full.slice(0, i));
      if (i >= full.length && streamTimer.current) {
        window.clearInterval(streamTimer.current);
      }
    }, 40);
    return () => {
      if (streamTimer.current) window.clearInterval(streamTimer.current);
    };
  }, [isStreaming]);

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? composerValue).trim();
    if (!text) return;

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setComposerValue('');
    setThinking(true);

    window.setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'Looking across your recent writing, this connects to how you return to consistency after a pause rather than pushing harder.',
          citationCount: 3,
          citationDates: ['Aug 1', 'Jul 29', 'Jul 24'],
        },
      ]);
    }, 1400);
  };

  const handleSuggestion = (question: string) => {
    handleSend(question);
  };

  const showThinking = thinking || isThinking;

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* 1. Header */}
      <AIHeader
        userInitials={userInitials}
        onHistoryClick={() => onToast?.('Reflection history')}
        onAvatarClick={() => onToast?.('User Profile & Settings')}
      />

      {/* 2. Memory Context Card */}
      <section>
        {isLoading ? (
          <div className="bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 animate-pulse space-y-3">
            <div className="h-4 bg-[#E7E1EF] rounded w-1/3" />
            <div className="h-6 bg-[#E7E1EF] rounded w-3/4" />
            <div className="h-4 bg-[#E7E1EF] rounded w-1/4" />
          </div>
        ) : (
          <MemoryContextCard
            label="Using your memory"
            threads={['clarity', 'discipline', 'starting again']}
            actionText="Change context"
            isEmptyContext={isNoMemoryContext}
            onChangeContext={() => onToast?.('Change memory context')}
          />
        )}
      </section>

      {/* 3. Hero Prompt */}
      <section className="flex flex-col gap-3 text-left">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-[#E7E1EF] rounded w-4/5" />
            <div className="h-10 bg-[#E7E1EF] rounded w-3/5" />
            <div className="h-4 bg-[#E7E1EF] rounded w-2/3" />
          </div>
        ) : (
          <>
            <h2 className="font-serif text-[32px] sm:text-[34px] text-[#0D102B] font-normal leading-[1.18] tracking-tight">
              What should we look
              <br />
              at together?
            </h2>
            <p className="font-sans text-[14.5px] text-[#8B8998] font-normal leading-[1.6]">
              Ask about a pattern, revisit an entry,
              <br />
              or reflect on what keeps showing up.
            </p>
          </>
        )}
      </section>

      {/* 4. Suggested Questions */}
      <section className="flex flex-col gap-3">
        {isLoading
          ? [0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[56px] bg-[#E7E1EF] rounded-[18px] animate-pulse"
              />
            ))
          : DEFAULT_SUGGESTIONS.map((q) => (
              <SuggestionRow key={q} question={q} onClick={handleSuggestion} />
            ))}
      </section>

      {/* Divider between suggestions and conversation */}
      <div className="w-full border-t border-[#E9E4E0]" />

      {/* 5. Conversation Preview */}
      <section className="flex flex-col gap-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-[#E7E1EF] rounded-[20px] w-2/3 ml-auto" />
            <div className="h-24 bg-[#E7E1EF] rounded-[20px] w-4/5" />
          </div>
        ) : messages.length === 0 && !showThinking ? (
          <p className="font-sans text-[14px] text-[#8B8998] py-2 text-left">
            Your reflections with Jouspace will appear here.
          </p>
        ) : (
          <>
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <UserMessageBubble
                  key={msg.id}
                  text={msg.text}
                  timestamp={msg.timestamp}
                />
              ) : (
                <AssistantMessageBubble
                  key={msg.id}
                  text={
                    isStreaming && streamedText !== null && msg.id === 'msg-assistant-1'
                      ? streamedText
                      : msg.text
                  }
                  citationCount={
                    isStreaming && msg.id === 'msg-assistant-1'
                      ? undefined
                      : msg.citationCount
                  }
                  citationDates={
                    isStreaming && msg.id === 'msg-assistant-1'
                      ? undefined
                      : msg.citationDates
                  }
                  onCitationClick={() =>
                    onToast?.('Opening the 3 entries behind this reflection')
                  }
                />
              )
            )}

            {showThinking && <AssistantMessageBubble text="" isThinking />}
          </>
        )}
      </section>

      {/* 6. Composer — pinned above the bottom navigation */}
      <div
        className={`sticky z-40 mt-1 transition-all duration-200 ${
          isKeyboardOpen ? 'bottom-[96px]' : 'bottom-[96px]'
        }`}
      >
        <Composer
          value={composerValue}
          onChange={setComposerValue}
          onSend={() => handleSend()}
          onAttach={() => onToast?.('Attach an entry or note')}
          onMic={() => onToast?.('Voice reflection')}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          isFocused={focused || isComposerFocused}
        />
      </div>

      {/* 7. Bottom Navigation */}
      <div className="sticky bottom-4 z-40">
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
