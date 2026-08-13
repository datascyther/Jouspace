import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface JournalHeaderProps {
  onBack?: () => void;
  className?: string;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  onBack,
  className = '',
}) => {
  return (
    <header
      className={`flex items-center justify-between w-full py-2 bg-base border-none shadow-none ${className}`}
    >
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="p-1.5 -ml-1 text-primaryText hover:text-accent rounded-full transition-colors cursor-pointer focus:outline-none"
      >
        <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
      </button>

      {/* Editorial Page Title */}
      <h1 className="font-serif font-medium text-[20px] text-primaryText tracking-tight">
        Journal
      </h1>

      {/* Spacer — keeps the title centered now that Save is removed */}
      <span className="w-8" aria-hidden="true" />
    </header>
  );
};
