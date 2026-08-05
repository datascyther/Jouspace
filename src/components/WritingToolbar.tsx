import React from 'react';
import { Mic, Image, Tag, Sparkles } from 'lucide-react';

interface WritingToolbarProps {
  onMicClick?: () => void;
  onImageClick?: () => void;
  onTagClick?: () => void;
  onAiSparkleClick?: () => void;
  onDoneClick?: () => void;
  className?: string;
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
      className={`w-full bg-[#FFFEFC] border-t border-[#E9E4E0] min-h-[64px] py-2 px-4 flex items-center justify-between transition-all duration-200 ${
        isKeyboardOpen ? 'shadow-md border-b border-[#E7E1EF]' : ''
      } ${className}`}
    >
      {/* Icon Group */}
      <div className="flex items-center gap-5 sm:gap-6 text-[#8B8998]">
        {/* 1. Microphone */}
        <button
          type="button"
          onClick={onMicClick}
          aria-label="Voice memo"
          className="p-1.5 hover:text-[#6D4FD7] transition-colors rounded-full focus:outline-none cursor-pointer"
        >
          <Mic className="w-[20px] h-[20px] stroke-[1.6]" />
        </button>

        {/* 2. Image */}
        <button
          type="button"
          onClick={onImageClick}
          aria-label="Insert image"
          className="p-1.5 hover:text-[#6D4FD7] transition-colors rounded-full focus:outline-none cursor-pointer"
        >
          <Image className="w-[20px] h-[20px] stroke-[1.6]" />
        </button>

        {/* 3. Tag */}
        <button
          type="button"
          onClick={onTagClick}
          aria-label="Add tag"
          className="p-1.5 hover:text-[#6D4FD7] transition-colors rounded-full focus:outline-none cursor-pointer"
        >
          <Tag className="w-[20px] h-[20px] stroke-[1.6]" />
        </button>

        {/* 4. Sparkle */}
        <button
          type="button"
          onClick={onAiSparkleClick}
          aria-label="AI memory assist"
          className="p-1.5 hover:text-[#6D4FD7] transition-colors rounded-full focus:outline-none cursor-pointer"
        >
          <Sparkles className="w-[20px] h-[20px] stroke-[1.6]" />
        </button>
      </div>

      {/* Done Button (Right Aligned, Filled Accent Purple) */}
      <button
        type="button"
        onClick={onDoneClick}
        className="bg-[#6D4FD7] hover:bg-[#5C3EC5] active:bg-[#5034B3] text-white font-sans font-medium text-[14px] px-5 py-2 rounded-[14px] transition-all duration-150 shadow-xs cursor-pointer focus:outline-none"
      >
        Done
      </button>
    </div>
  );
};
