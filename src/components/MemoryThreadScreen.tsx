import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface MemoryThreadScreenProps {
  onBack?: () => void;
  onReflectWithAI?: () => void;
  className?: string;
}

const THREAD_ENTRIES = [
  {
    id: '1',
    date: 'Aug 4, 2026',
    excerpt: "I keep returning to the same thought: I don't need a louder system. I need a quieter place that remembers what matters.",
  },
  {
    id: '2',
    date: 'Jul 28, 2026',
    excerpt: "The best ideas come when I stop trying to force them. I need to create space for them to arrive.",
  },
  {
    id: '3',
    date: 'Jul 14, 2026',
    excerpt: "Building something with intention. Less noise, more clarity. That's the goal.",
  },
];

export const MemoryThreadScreen: React.FC<MemoryThreadScreenProps> = ({
  onBack,
  onReflectWithAI,
  className = '',
}) => {
  return (
    <div className={`flex flex-col w-full pt-4 px-6 animate-fadeIn ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
        >
          <ArrowLeft className="w-[18px] h-[18px] stroke-[1.8]" />
        </button>
        <h1 className="font-serif font-medium text-[22px] text-primaryText tracking-tight">
          Memory thread
        </h1>
      </div>

      {/* Theme Title */}
      <div className="bg-surface border border-border rounded-2xl px-5 py-4 mb-6">
        <h2 className="font-serif font-medium text-[20px] text-primaryText mb-1">
          Building Jouspace with less noise and more clarity
        </h2>
        <p className="font-sans text-[13px] text-muted">
          {THREAD_ENTRIES.length} connected entries
        </p>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-0 mb-8">
        {THREAD_ENTRIES.map((entry, index) => (
          <div key={entry.id} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-1.5" />
              {index < THREAD_ENTRIES.length - 1 && (
                <div className="w-0.5 flex-1 bg-border my-1" />
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

      {/* Reflect with AI Button */}
      <button
        type="button"
        onClick={onReflectWithAI}
        className="w-full bg-accent hover:bg-accentHover active:bg-accentActive text-white font-sans font-medium text-[15px] py-4 rounded-[18px] transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer flex items-center justify-center gap-2"
      >
        <Sparkles className="w-[18px] h-[18px] stroke-[1.8]" />
        Reflect with AI
      </button>
    </div>
  );
};
