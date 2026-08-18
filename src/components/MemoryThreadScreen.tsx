import React from 'react';
import { X } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';

interface MemoryThreadEntry {
  id: string;
  date: string;
  excerpt: string;
}

interface MemoryThreadScreenProps {
  title?: string;
  entries?: MemoryThreadEntry[];
  onBack?: () => void;
  onReflectWithAI?: () => void;
  className?: string;
}

export const MemoryThreadScreen: React.FC<MemoryThreadScreenProps> = ({
  title = 'Memory thread',
  entries = [],
  onBack,
  onReflectWithAI,
  className = '',
}) => {
  return (
    <div className={`flex flex-col w-full flex-1 min-h-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3 shrink-0 border-b border-borderSubtle">
        <h1 className="font-serif font-medium text-[22px] text-primaryText tracking-tight">
          Memory thread
        </h1>
        <button
          type="button"
          onClick={onBack}
          aria-label="Close"
          className="w-8 h-8 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-6 pb-6 pb-safe">
        {/* Theme Title */}
        <div className="bg-surface border border-borderSubtle rounded-2xl px-5 py-4 mt-5 mb-6">
          <h2 className="font-serif font-medium text-[20px] text-primaryText mb-1 capitalize">
            {title}
          </h2>
          <p className="font-sans text-[13px] text-muted">
            {entries.length} connected {entries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* Timeline */}
        {entries.length === 0 ? (
          <p className="font-sans text-[14px] text-muted mb-8">
            No entries in this thread yet.
          </p>
        ) : (
          <div className="flex flex-col gap-0 mb-8">
            {entries.map((entry, index) => (
              <div key={entry.id} className="cvi-auto flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-1.5" />
                  {index < entries.length - 1 && (
                    <div className="w-0.5 flex-1 bg-borderSubtle my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <p className="font-sans text-[11px] text-muted mb-1.5">
                    {entry.date}
                  </p>
                  <p className="font-sans text-[14px] text-primaryText leading-relaxed">
                    {entry.excerpt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reflect with AI Button */}
        <button
          type="button"
          onClick={onReflectWithAI}
          className="w-full bg-accent hover:bg-accentHover active:bg-accentActive text-white font-sans font-medium text-[15px] py-4 rounded-[18px] transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer flex items-center justify-center gap-2"
        >
          <TbSparkle className="w-[18px] h-[18px] stroke-[1.8]" />
          Reflect with AI
        </button>
      </div>
    </div>
  );
};
