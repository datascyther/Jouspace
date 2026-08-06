import React from 'react';
import { ArrowLeft, Edit3, Share2, Trash2 } from 'lucide-react';

interface EntryDetailScreenProps {
  onBack?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const EntryDetailScreen: React.FC<EntryDetailScreenProps> = ({
  onBack,
  onEdit,
  className = '',
}) => {
  return (
    <div className={`flex flex-col w-full pt-4 px-6 animate-fadeIn ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
        >
          <ArrowLeft className="w-[18px] h-[18px] stroke-[1.8]" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit entry"
            className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 stroke-[1.8]" />
          </button>
          <button
            type="button"
            aria-label="Share entry"
            className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
          >
            <Share2 className="w-4 h-4 stroke-[1.8]" />
          </button>
          <button
            type="button"
            aria-label="Delete entry"
            className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-[#C53030] hover:bg-[#FDECEC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C53030]/20 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Date */}
      <p className="font-sans text-[12px] text-muted mb-3">
        August 4, 2026 • 6:58 PM
      </p>

      {/* Title */}
      <h1 className="font-serif font-medium text-[26px] text-primaryText leading-tight tracking-tight mb-5">
        What I'm trying to understand
      </h1>

      {/* Body */}
      <div className="font-sans text-[15px] text-primaryText leading-[1.75] mb-8">
        <p className="mb-4">
          I keep returning to the same thought:
        </p>
        <p className="mb-4">
          I don't need a louder system.
        </p>
        <p>
          I need a quieter place that remembers what matters.
        </p>
      </div>

      {/* Memory References */}
      <div className="border-t border-divider pt-5">
        <h3 className="font-sans text-[13px] font-medium text-muted uppercase tracking-wider mb-3">
          Connected memories
        </h3>
        <div className="flex flex-col gap-2">
          <div className="bg-accentSoft rounded-xl px-4 py-3">
            <p className="font-sans text-[13px] text-accent font-medium mb-0.5">
              Building Jouspace with less noise
            </p>
            <p className="font-sans text-[12px] text-secondaryText">
              3 connected entries
            </p>
          </div>
          <div className="bg-accentSoft rounded-xl px-4 py-3">
            <p className="font-sans text-[13px] text-accent font-medium mb-0.5">
              Quiet spaces and reflection
            </p>
            <p className="font-sans text-[12px] text-secondaryText">
              2 connected entries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
