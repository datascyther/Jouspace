import React from 'react';
import { ChevronRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* User Message Bubble                                                 */
/* ------------------------------------------------------------------ */

interface UserMessageBubbleProps {
  text: string;
  timestamp?: string;
  className?: string;
}

export const UserMessageBubble: React.FC<UserMessageBubbleProps> = ({
  text,
  timestamp,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-end w-full ${className}`}>
      <div className="max-w-[85%] bg-accentSoft rounded-[20px] px-5 py-3.5">
        <p className="font-sans text-[14.5px] leading-[1.5] text-primaryText font-normal text-left">
          {text}
        </p>
      </div>
      {timestamp && (
        <span className="font-sans text-[11.5px] text-muted mt-1.5 mr-1">
          {timestamp}
        </span>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Memory Citation Footer                                              */
/* ------------------------------------------------------------------ */

interface MemoryCitationProps {
  entryCount: number;
  dates: string[];
  onClick?: () => void;
  className?: string;
}

export const MemoryCitation: React.FC<MemoryCitationProps> = ({
  entryCount,
  dates,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 text-accent font-sans text-[12.5px] font-normal transition-opacity hover:opacity-80 cursor-pointer focus:outline-none text-left ${className}`}
    >
      <span>From {entryCount} entries</span>
      <span className="text-accent/60">•</span>
      <span>{dates.join(', ')}</span>
      <ChevronRight className="w-3.5 h-3.5 stroke-[1.9] shrink-0" />
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Assistant Message Bubble                                            */
/* ------------------------------------------------------------------ */

interface AssistantMessageBubbleProps {
  text: string;
  citationCount?: number;
  citationDates?: string[];
  onCitationClick?: () => void;
  isThinking?: boolean;
  className?: string;
}

export const AssistantMessageBubble: React.FC<AssistantMessageBubbleProps> = ({
  text,
  citationCount,
  citationDates,
  onCitationClick,
  isThinking = false,
  className = '',
}) => {
  return (
    <div className={`flex justify-start w-full ${className}`}>
      <div className="max-w-[85%] bg-surface border border-border rounded-[20px] px-5 py-4 flex flex-col gap-3">
        {isThinking ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" />
          </div>
        ) : (
          <p className="font-sans text-[14.5px] leading-[1.65] text-primaryText font-normal whitespace-pre-line text-left">
            {text}
          </p>
        )}

        {!isThinking && citationCount && citationDates && (
          <MemoryCitation
            entryCount={citationCount}
            dates={citationDates}
            onClick={onCitationClick}
          />
        )}
      </div>
    </div>
  );
};
