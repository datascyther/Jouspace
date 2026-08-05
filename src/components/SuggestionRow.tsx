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
      className={`group w-full flex items-center justify-between bg-[#FFFEFC] border border-[#E7E1EF] rounded-[18px] px-5 py-4 min-h-[56px] text-left transition-colors duration-150 hover:border-[#6D4FD7]/40 cursor-pointer focus:outline-none ${className}`}
    >
      <span className="font-sans text-[14.5px] text-[#0D102B] font-normal leading-snug pr-3">
        {question}
      </span>
      <ChevronRight className="w-[18px] h-[18px] text-[#0D102B] group-hover:text-[#6D4FD7] shrink-0 stroke-[1.6] transition-colors" />
    </button>
  );
};
