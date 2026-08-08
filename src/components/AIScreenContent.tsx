import React, { useState, useRef, useEffect } from 'react';
import { AIHeader } from './AIHeader';
import { MemoryContextCard } from './MemoryContextCard';
import { SuggestionRow } from './SuggestionRow';
import { UserMessageBubble, AssistantMessageBubble } from './MessageBubbles';
import { Composer } from './Composer';
import { BottomNavigation, NavTab } from './BottomNavigation';
import { EntryPickerSheet } from './EntryPickerSheet';
import {
  useJouspaceIntelligence,
  RUNTIME_UNAVAILABLE_MESSAGE,
  loadChatMessages,
} from '../hooks/useJouspaceIntelligence';
import { journalStore } from '../store';
import type { Entry } from './EntryRow';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  citationCount?: number;
  citationDates?: string[];
}

/** Neutral prompts shown when the conversation is empty. */
export const DEFAULT_SUGGESTIONS: string[] = [
  'Why do I keep returning to clarity?',
  'Show me what changed this month.',
  'Help me continue my last entry.',
];

interface AIScreenContentProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userInitials?: string;
  isNoMemoryContext?: boolean;
  /** User-chosen AI context label (from the context picker). */
  contextLabel?: string | null;
  /** Journal entries, used by attach + citation lookups. */
  entries?: Entry[];
  onAvatarClick?: () => void;
  onOpenHistory?: () => void;
  onOpenContextPicker?: () => void;
  onOpenEntry?: (id: string) => void;
}

/** Real themes present in the journal, used as AI memory context. */
function realContextThreads(): string[] {
  const set = new Set<string>();
  for (const e of journalStore.list()) set.add(e.theme);
  return Array.from(set);
}

/** Web Speech API constructor if available on this browser. */
function getSpeechRecognitionCtor(): any {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const AIScreenContent: React.FC<AIScreenContentProps> = ({
  activeTab,
  onTabChange,
  userInitials = 'J',
  isNoMemoryContext = false,
  contextLabel = null,
  entries = [],
  onAvatarClick = () => {},
  onOpenHistory,
  onOpenContextPicker,
  onOpenEntry,
}) => {
  const [composerValue, setComposerValue] = useState('');
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  // Restore persisted chat history on mount so navigation doesn't lose it.
  const [initialMessages] = useState(() => loadChatMessages());
  const ai = useJouspaceIntelligence('chat', initialMessages);

  // Voice input (Web Speech API; gracefully disabled when unavailable).
  const recognitionCtor = getSpeechRecognitionCtor();
  const micSupported = recognitionCtor !== null;
  const recognitionRef = useRef<any>(null);
  const baseRef = useRef('');

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? composerValue).trim();
    if (!text) return;
    setComposerValue('');
    ai.send(text);
  };

  const handleSuggestion = (question: string) => handleSend(question);

  const handleMic = () => {
    if (!micSupported) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }
    const rec = new recognitionCtor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    baseRef.current = composerValue; // text present before dictation starts
    rec.onresult = (event: any) => {
      const full = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      const sep = baseRef.current ? ' ' : '';
      setComposerValue(baseRef.current + sep + full); // replace, never append
    };
    rec.onend = () => {
      recognitionRef.current = null;
    };
    rec.onerror = () => {
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
    }
  };

  // Map citation dates → journal entries, then open the detail drawer.
  const handleCitation = (msg: AIMessage) => {
    if (!msg.citationDates || msg.citationDates.length === 0) return;
    const list = entries.length > 0 ? entries : journalStore.list();
    if (list.length === 0) return;
    const match =
      list.find((e) => msg.citationDates!.includes(e.date)) ?? list[0];
    onOpenEntry?.(match.id);
  };

  const handleAttachSelect = (entry: Entry) => {
    setComposerValue((prev) => (prev ? `${prev}\n` : '') + `Re: ${entry.title}`);
    setIsAttachOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-2 pb-4">
        <div className="flex flex-col gap-7 w-full">
          <AIHeader
            userInitials={userInitials}
            onHistoryClick={onOpenHistory}
            onAvatarClick={onAvatarClick}
          />

          <section>
            <MemoryContextCard
              label="Using your memory"
              threads={isNoMemoryContext ? [] : realContextThreads()}
              actionText="Change context"
              isEmptyContext={isNoMemoryContext}
              contextLabel={contextLabel}
              onChangeContext={onOpenContextPicker}
            />
          </section>

          <section className="flex flex-col gap-3 text-left">
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
          </section>

          <section className="flex flex-col gap-3">
            {DEFAULT_SUGGESTIONS.map((q) => (
              <SuggestionRow key={q} question={q} onClick={handleSuggestion} />
            ))}
          </section>

          <div className="w-full border-t border-divider" />

          <section className="flex flex-col gap-4">
            {ai.messages.length === 0 && !ai.isThinking ? (
              <p className="font-sans text-[14px] text-muted py-2 text-left">
                Your reflections with Jouspace will appear here.
              </p>
            ) : (
              <>
                {ai.messages.map((msg) =>
                  msg.role === 'user' ? (
                    <UserMessageBubble
                      key={msg.id}
                      text={msg.text}
                      timestamp={msg.timestamp}
                    />
                  ) : (
                    <AssistantMessageBubble
                      key={msg.id}
                      text={msg.text}
                      citationCount={msg.citationCount}
                      citationDates={msg.citationDates}
                      onCitationClick={() => handleCitation(msg)}
                    />
                  )
                )}

                {ai.isThinking && <AssistantMessageBubble text="" isThinking />}

                {ai.error && (
                  <p className="font-sans text-[13px] text-muted py-1">
                    {ai.error === RUNTIME_UNAVAILABLE_MESSAGE
                      ? RUNTIME_UNAVAILABLE_MESSAGE
                      : 'Jouspace Intelligence is unavailable. Please try again.'}
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
          onAttach={() => setIsAttachOpen(true)}
          onMic={handleMic}
          micDisabled={!micSupported}
          disabled={ai.isThinking || ai.isStreaming}
        />
      </div>

      {/* Entry picker for attach */}
      <EntryPickerSheet
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        entries={entries}
        onSelect={handleAttachSelect}
      />

      {/* Pinned BottomNavigation */}
      <div className="shrink-0">
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
