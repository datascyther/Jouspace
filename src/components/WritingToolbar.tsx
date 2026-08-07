import React from 'react';
import { Mic, Image, Tag, Sparkles } from 'lucide-react';

interface WritingToolbarProps {
  onMicClick?: () => void;
  onImageClick?: () => void;
  onTagClick?: () => void;
  onAiSparkleClick?: () => void;
  onDoneClick?: () => void;
  className?: string;
  // NOTE: isKeyboardOpen is a QA demo state, not runtime detection.
  // Used for visual styling only (shadow/border). Keyboard repositioning is not implemented.
  isKeyboardOpen?: boolean;
}

export const WritingToolbar: React.FC<WritingToolbarProps> = ({
  onMicClick,
  onImageClick,
  onTagClick,
  onAiSparkleClick,
  onDoneClick,
  className = '',
  isKeyboardOpen = false,
}) => {
  return (
    <div
      className={`w-full bg-surface border-t border-divider min-h-[64px] py-2 px-4 flex items-center justify-between transition-all duration-200 ${
        isKeyboardOpen ? 'shadow-md border-b border-border' : ''
      } ${className}`}
    >
      {/* Icon Group */}
      <div className="flex items-center gap-5 text-muted">
        {/* 1. Microphone */}
        <button
          type="button"
          onClick={onMicClick}
          aria-label="Voice memo"
          className="p-1.5 hover:text-accent transition-colors rounded-full focus:outline-none cursor-pointer"
        >
          <Mic className="w-[20px] h-[20px] stroke-[1.6]" />
        </button>

        {/* 2. Image */}
        <button
          type="button"
          onClick={onImageClick}
          aria-label="Insert image"
          className="p-1.5 hover:text-accent transition-colors rounded-full focus:outline-none cursor-pointer"
        >
          <Image className="w-[20px] h-[20px] stroke-[1.6]" />
        </button>

        {/* 3. Tag */}
        <button
          type="button"
          onClick={onTagClick}
          aria-label="Add tag"
          className="p-1.5 hover:text-accent transition-colors rounded-full focus:outline-none cursor-pointer"
        >
          <Tag className="w-[20px] h-[20px] stroke-[1.6]" />
        </button>

        {/* 4. Sparkle */}
        <button
          type="button"
          onClick={onAiSparkleClick}
          aria-label="AI memory assist"
          className="p-1.5 hover:text-accent transition-colors rounded-full focus:outline-none cursor-pointer"
        >
          <Sparkles className="w-[20px] h-[20px] stroke-[1.6]" />
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
