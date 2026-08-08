import React from 'react';
import { Mic, Image, Tag, Sparkles } from 'lucide-react';

interface WritingToolbarProps {
  onMicClick?: () => void;
  onImageClick?: () => void;
  onTagClick?: () => void;
  onAiSparkleClick?: () => void;
  onDoneClick?: () => void;
  className?: string;
  /** Disable the media/AI extras (unavailable in the local-first v1). */
  extrasDisabled?: boolean;
}

export const WritingToolbar: React.FC<WritingToolbarProps> = ({
  onMicClick,
  onImageClick,
  onTagClick,
  onAiSparkleClick,
  onDoneClick,
  className = '',
  extrasDisabled = false,
}) => {
  return (
    <div
      className={`w-full bg-surface border-t border-divider min-h-16 py-2 px-4 flex items-center justify-between transition-all duration-200 ${className}`}
    >
      {/* Icon Group */}
      <div className="flex items-center gap-5 text-muted">
        {/* 1. Microphone */}
        <button
          type="button"
          onClick={onMicClick}
          aria-label="Voice memo"
          disabled={extrasDisabled}
          className="p-1.5 hover:text-accent transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted"
        >
          <Mic className="w-5 h-5 stroke-[1.6]" />
        </button>

        {/* 2. Image */}
        <button
          type="button"
          onClick={onImageClick}
          aria-label="Insert image"
          disabled={extrasDisabled}
          className="p-1.5 hover:text-accent transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted"
        >
          <Image className="w-5 h-5 stroke-[1.6]" />
        </button>

        {/* 3. Tag */}
        <button
          type="button"
          onClick={onTagClick}
          aria-label="Add tag"
          disabled={extrasDisabled}
          className="p-1.5 hover:text-accent transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted"
        >
          <Tag className="w-5 h-5 stroke-[1.6]" />
        </button>

        {/* 4. Sparkle */}
        <button
          type="button"
          onClick={onAiSparkleClick}
          aria-label="AI memory assist"
          disabled={extrasDisabled}
          className="p-1.5 hover:text-accent transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted"
        >
          <Sparkles className="w-5 h-5 stroke-[1.6]" />
        </button>
      </div>

      {/* Done Button (Right Aligned, Filled Accent Purple) */}
      <button
        type="button"
        onClick={onDoneClick}
        className="bg-accent hover:bg-accentHover active:bg-accentActive text-white font-sans font-medium text-[14px] px-5 py-2 rounded-[14px] transition-all duration-150 shadow-xs cursor-pointer focus:outline-none"
      >
        Done
      </button>
    </div>
  );
};
