import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SuggestionRowProps {
  question: string;
  onClick?: (question: string) => void;
  className?: string;
}

export const SuggestionRow: React.FC<SuggestionRowProps> = ({
  question,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(question)}
      className={`group w-full flex items-center justify-between bg-surface hover:bg-elevated border border-borderSubtle rounded-[18px] px-5 py-4 min-h-14 text-left transition-colors duration-150 hover:border-accent/40 cursor-pointer focus:outline-none ${className}`}
    >
      <span className="font-sans text-[14.5px] text-primaryText font-normal leading-snug pr-3">
        {question}
      </span>
      <ChevronRight className="w-[18px] h-[18px] text-primaryText group-hover:text-accent shrink-0 stroke-[1.6] transition-colors" />
    </button>
  );
};
