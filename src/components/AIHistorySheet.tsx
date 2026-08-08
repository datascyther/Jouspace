import React, { useId, useRef } from 'react';
import { X, History } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CHAT_STORAGE_KEY, type IntelligenceMessage } from '../hooks/useJouspaceIntelligence';

interface AIHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Bottom-sheet showing the persisted AI chat history (localStorage).
 * The history is powered by the same messages that useJouspaceIntelligence
 * persists for the 'chat' capability, so it survives tab navigation.
 */
export const AIHistorySheet: React.FC<AIHistorySheetProps> = ({
  isOpen,
  onClose,
}) => {
  const sheetId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ id: sheetId, active: isOpen, onClose, containerRef: sheetRef });

  let messages: IntelligenceMessage[] = [];
  if (isOpen) {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) messages = JSON.parse(raw) as IntelligenceMessage[];
    } catch {
      messages = [];
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={sheetRef}
      className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn"
    >
      <div className="absolute inset-0 bg-primaryText/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Conversation history"
        className="relative w-full max-w-[430px] bg-surface rounded-t-[28px] px-6 pt-4 pb-8 animate-slideUp max-h-[85vh] overflow-y-auto"
      >
        <div className="w-9 h-1 rounded-full bg-border mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-medium text-[20px] text-primaryText">
            Reflection history
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-secondaryText hover:bg-border transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
                    : 'bg-background border border-border max-w-[85%]'
                }`}
              >
                <p className="font-sans text-[12px] text-muted mb-1 capitalize">
                  {m.role === 'user' ? 'You' : 'Jouspace'}
                </p>
                <p className="font-sans text-[14px] leading-[1.55] text-primaryText whitespace-pre-line">
                  {m.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
