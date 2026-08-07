import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AutosaveStatus } from './JournalMetadata';

interface JournalHeaderProps {
  onBack?: () => void;
  onSave?: () => void;
  saveState?: AutosaveStatus;
  className?: string;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  onBack,
  onSave,
  saveState = 'autosaved',
  className = '',
}) => {
  return (
    <header
      className={`flex items-center justify-between w-full py-2 bg-transparent border-none shadow-none ${className}`}
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

      {/* Save Text Action Button */}
      <button
        type="button"
        onClick={onSave}
        className="font-sans font-medium text-[14.5px] text-accent hover:text-accentAlt transition-colors cursor-pointer focus:outline-none"
      >
        {saveState === 'autosaving' ? 'Saving...' : 'Save'}
      </button>
    </header>
  );
};
