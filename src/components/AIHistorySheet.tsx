import React from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { LazyMarkdown } from './LazyMarkdown';
import { CHAT_STORAGE_KEY, type IntelligenceMessage } from '../hooks/useJouspaceIntelligence';

interface AIHistoryScreenProps {
  onBack: () => void;
}

/**
 * Full-screen route showing the persisted AI chat history (localStorage).
 * The history is powered by the same messages that useJouspaceIntelligence
 * persists for the 'chat' capability, so it survives tab navigation.
 */
export const AIHistoryScreen: React.FC<AIHistoryScreenProps> = ({ onBack }) => {
  let messages: IntelligenceMessage[] = [];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) messages = JSON.parse(raw) as IntelligenceMessage[];
  } catch {
    messages = [];
  }

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-serif font-medium text-[18px] text-primaryText">
          Reflection history
        </h1>
        <div className="w-9 h-9" aria-hidden="true" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 pb-4 pb-safe">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-accentSoft flex items-center justify-center mb-3 text-accent">
              <History className="w-5 h-5 stroke-[1.8]" />
            </div>
            <p className="font-sans text-[14px] text-muted">
              No reflections yet. Ask the AI anything to start a history.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`px-4 py-3 rounded-[14px] ${
                  m.role === 'user'
                    ? 'bg-accentSoft self-end max-w-[85%]'
                    : 'bg-base border border-borderSubtle max-w-[85%]'
                }`}
              >
                <p className="font-sans text-[12px] text-muted mb-1 capitalize">
                  {m.role === 'user' ? 'You' : 'Jouspace'}
                </p>
                {m.role === 'user' ? (
                  <p className="font-sans text-[14px] leading-[1.55] text-primaryText whitespace-pre-line">
                    {m.text}
                  </p>
                ) : (
                  <LazyMarkdown text={m.text} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
