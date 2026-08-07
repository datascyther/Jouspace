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
import {
  useJouspaceIntelligence,
  type IntelligenceMessage,
} from '../hooks/useJouspaceIntelligence';

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
  onToast?: (msg: string) => void;
}

function toAIMessage(m: IntelligenceMessage): AIMessage {
  return {
    id: m.id,
    role: m.role,
    text: m.text,
    timestamp: m.timestamp,
    citationCount: m.citationCount,
    citationDates: m.citationDates,
  };
}

export const AIScreenContent: React.FC<AIScreenContentProps> = ({
  activeTab,
  onTabChange,
  userInitials = 'VU',
  isLoading = false,
  isThinking: qaThinking = false,
  isStreaming: qaStreaming = false,
  isNoMemoryContext = false,
  isNoConversation = false,
  isComposerFocused = false,
  onToast,
}) => {
  const [composerValue, setComposerValue] = useState('');
  const [focused, setFocused] = useState(isComposerFocused);

  const ai = useJouspaceIntelligence('chat');

  const streamTimer = useRef<number | null>(null);
  const [qaStreamedText, setQaStreamedText] = useState<string | null>(null);

  useEffect(() => {
    if (!qaStreaming) {
      setQaStreamedText(null);
      return;
    }
    const full = DEFAULT_CONVERSATION[1].text;
    let i = 0;
    setQaStreamedText('');
    streamTimer.current = window.setInterval(() => {
      i += 2;
      setQaStreamedText(full.slice(0, i));
      if (i >= full.length && streamTimer.current) {
        window.clearInterval(streamTimer.current);
      }
    }, 40);
    return () => {
      if (streamTimer.current) window.clearInterval(streamTimer.current);
    };
  }, [qaStreaming]);

  const useQaDemoConversation = qaThinking || qaStreaming || !isNoConversation && ai.messages.length === 0;
  const displayMessages: AIMessage[] = useQaDemoConversation
    ? isNoConversation
      ? []
      : DEFAULT_CONVERSATION
    : ai.messages.map(toAIMessage);

  const showThinking = ai.isThinking || qaThinking;

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? composerValue).trim();
    if (!text) return;
    setComposerValue('');
    ai.send(text);
  };

  const handleSuggestion = (question: string) => handleSend(question);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
        <div className="flex flex-col gap-7 w-full">
          <AIHeader
            userInitials={userInitials}
            onHistoryClick={() => onToast?.('Reflection history')}
            onAvatarClick={() => onToast?.('User Profile & Settings')}
          />

          <section>
            {isLoading ? (
              <div className="bg-surface rounded-[24px] border border-border p-6 animate-pulse space-y-3">
                <div className="h-4 bg-border rounded w-1/3" />
                <div className="h-6 bg-border rounded w-3/4" />
                <div className="h-4 bg-border rounded w-1/4" />
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

          <section className="flex flex-col gap-3 text-left">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-border rounded w-4/5" />
                <div className="h-10 bg-border rounded w-3/5" />
                <div className="h-4 bg-border rounded w-2/3" />
              </div>
            ) : (
              <>
                <h2 className="font-serif text-[28px] text-primaryText font-normal leading-[1.18] tracking-tight">
                  What should we look
                  <br />
                  at together?
                </h2>
                <p className="font-sans text-[14.5px] text-muted font-normal leading-[1.6]">
                  Ask about a pattern, revisit an entry,
                  <br />
                  or reflect on what keeps showing up.
                </p>
              </>
            )}
          </section>

          <section className="flex flex-col gap-3">
            {isLoading
              ? [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-[56px] bg-border rounded-[18px] animate-pulse"
                  />
                ))
              : DEFAULT_SUGGESTIONS.map((q) => (
                  <SuggestionRow key={q} question={q} onClick={handleSuggestion} />
                ))}
          </section>

          <div className="w-full border-t border-divider" />

          <section className="flex flex-col gap-4">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-border rounded-[20px] w-2/3 ml-auto" />
                <div className="h-24 bg-border rounded-[20px] w-4/5" />
              </div>
            ) : displayMessages.length === 0 && !showThinking ? (
              <p className="font-sans text-[14px] text-muted py-2 text-left">
                Your reflections with Jouspace will appear here.
              </p>
            ) : (
              <>
                {displayMessages.map((msg) =>
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
                        qaStreaming && qaStreamedText !== null && msg.id === 'msg-assistant-1'
                          ? qaStreamedText
                          : msg.text
                      }
                      citationCount={
                        qaStreaming && msg.id === 'msg-assistant-1'
                          ? undefined
                          : msg.citationCount
                      }
                      citationDates={
                        qaStreaming && msg.id === 'msg-assistant-1'
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

                {ai.error && (
                  <p className="font-sans text-[13px] text-muted py-1">
                    {ai.error}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Pinned Composer */}
      <div className="shrink-0 px-4 pt-1">
        <Composer
          value={composerValue}
          onChange={setComposerValue}
          onSend={() => handleSend()}
          onAttach={() => onToast?.('Attach an entry or note')}
          onMic={() => onToast?.('Voice reflection')}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          isFocused={focused || isComposerFocused}
          disabled={ai.isThinking || ai.isStreaming}
        />
      </div>

      {/* Pinned BottomNavigation */}
      <div className="shrink-0 mx-2 pb-2 pb-safe">
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
