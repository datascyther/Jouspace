import React from 'react';
import { TextAction } from './TextAction';
import { ArrowRight } from 'lucide-react';

interface WritingSummaryCardProps {
  entryCount: number;
  topThemes: string[];
  onExploreMemories?: () => void;
  className?: string;
}

export const WritingSummaryCard: React.FC<WritingSummaryCardProps> = ({
  entryCount,
  topThemes,
  onExploreMemories,
  className = '',
}) => {
  const themesText =
    topThemes.length === 3
      ? `${topThemes[0]},\n${topThemes[1]},\nand ${topThemes[2]}.`
      : topThemes.join(', ') + '.';

  return (
    <div
      className={`bg-surface rounded-[24px] border border-border p-6 flex flex-col gap-4 ${className}`}
    >
      {/* Top Label */}
      <span className="font-sans text-[12.5px] font-medium text-muted tracking-wide uppercase select-none">
        ✦ Your journal
      </span>

      {/* Body */}
      <p className="font-serif text-[17px] font-normal text-primaryText leading-[1.65] tracking-tight whitespace-pre-line m-0">
        {`You've written ${entryCount} entries.\n\nYour writing most often returns to\n${themesText}`}
      </p>

      {/* Bottom Action */}
      <TextAction onClick={onExploreMemories} className="mt-1">
        <span>Explore memories</span>
        <ArrowRight className="w-[16px] h-[16px] ml-1 stroke-[1.8]" />
      </TextAction>
    </div>
  );
};
