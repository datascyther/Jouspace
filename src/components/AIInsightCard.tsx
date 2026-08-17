import React from 'react';
import { MemoryLabel } from './MemoryLabel';
import { ArrowRight } from 'lucide-react';

interface AIInsightCardProps {
  insightText?: string;
  label?: string;
  onReflect?: () => void;
  className?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insightText = 'You often return to consistency when you write after a gap.',
  label = 'Jouspace noticed',
  onReflect,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border border-borderSubtle bg-surface p-6 text-primaryText ${className}`}
    >
      {/* Top Label — quiet purple eyebrow with sparkle */}
      <MemoryLabel text={label} className="tracking-wide" />

      {/* Body text — a relaxed observation, not a headline. Serif font for a
          refined, literary feel. Clamped to 2 lines so insights stay compact. */}
      <p className="font-serif text-[15px] leading-[1.55] text-primaryText font-normal max-w-[85%] line-clamp-2">
        {insightText}
      </p>

      {/* Bottom Action — a quiet invitation, anchored bottom-right */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onReflect}
          className="inline-flex items-center text-sm font-medium text-accent hover:text-accentAlt transition-colors duration-150 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Reflect with AI
          <ArrowRight className="w-4 h-4 ml-1 stroke-[1.8]" />
        </button>
      </div>
    </div>
  );
};
