import React from 'react';
import { TextAction } from './TextAction';
import { ArrowRight } from 'lucide-react';

interface WritingSummaryCardProps {
  entryCount: number;
  topThemes: string[];
  /** When provided, replaces the computed entry-count/themes text with an
   *  AI-written summary of the user's recent journal. */
  summaryText?: string;
  onExploreMemories?: () => void;
  className?: string;
}

export const WritingSummaryCard: React.FC<WritingSummaryCardProps> = ({
  entryCount,
  topThemes,
  summaryText,
  onExploreMemories,
  className = '',
}) => {
  const themesText =
    topThemes.length === 3
      ? `${topThemes[0]},\n${topThemes[1]},\nand ${topThemes[2]}.`
      : topThemes.join(', ') + '.';

  const bodyText =
    summaryText ??
    `You've written ${entryCount} entries.\n\nYour writing most often returns to\n${themesText}`;

  return (
    <div
      className={`bg-surface rounded-3xl border border-borderSubtle p-6 flex flex-col gap-4 ${className}`}
    >
      {/* Top Label */}
      <span className="font-sans text-[12.5px] font-medium text-muted tracking-wide uppercase select-none">
        ✦ Your journal
      </span>

      {/* Body */}
      <p className="font-serif text-[17px] font-normal text-primaryText leading-[1.65] tracking-tight whitespace-pre-line m-0">
        {bodyText}
      </p>

      {/* Bottom Action */}
      <TextAction onClick={onExploreMemories} className="mt-1">
        <span>Explore memories</span>
        <ArrowRight className="w-4 h-4 ml-1 stroke-[1.8]" />
      </TextAction>
    </div>
  );
};
