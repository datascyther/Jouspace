import React from 'react';
import { MemoryLabel } from './MemoryLabel';
import { TextAction } from './TextAction';
import { ArrowRight } from 'lucide-react';

interface MemoryInsightCardProps {
  label?: string;
  statement?: string;
  supportingCopy?: string;
  actionText?: string;
  onExploreThread?: () => void;
  className?: string;
}

export const MemoryInsightCard: React.FC<MemoryInsightCardProps> = ({
  label = 'Jouspace remembered',
  statement = 'You keep coming back to clarity.',
  supportingCopy = 'This theme appeared across 6 entries this month.',
  actionText = 'Explore thread',
  onExploreThread,
  className = '',
}) => {
  return (
    <div
      className={`relative bg-surface rounded-3xl border border-borderSubtle p-6 text-primaryText overflow-hidden flex flex-col gap-4 shadow-2xs ${className}`}
    >
      {/* Soft radial glow behind the artwork — full opacity so it reads as a glow */}
      <div
        aria-hidden="true"
        className="absolute -right-2.5 -top-2.5 w-44 h-44 pointer-events-none select-none"
      >
        <div className="absolute inset-0 bg-radial from-accent/30 via-accentSoft/40 to-transparent rounded-full blur-xl" />
      </div>

      {/* Decorative Abstract Memory Artwork (subtle, low opacity, clipped inside card) */}
      <div className="absolute -right-2.5 -top-2.5 w-44 h-44 pointer-events-none select-none opacity-40">
        {/* Abstract Infinity / Memory Star Vector */}
        <svg
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-accent"
        >
          {/* Infinity loop / ribbon path */}
          <path
            d="M40 80C40 102.091 57.9086 120 80 120C102.091 120 120 102.091 120 80C120 57.9086 102.091 40 80 40C57.9086 40 40 57.9086 40 80Z"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="3 3"
            className="opacity-30"
          />
          <path
            d="M30 100C50 60 110 100 130 60C150 20 90 20 70 60"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="opacity-25"
          />
          {/* Subtle Sparkle */}
          <path
            d="M110 50C110 58.2843 103.284 65 95 65C103.284 65 110 71.7157 110 80C110 71.7157 116.716 65 125 65C116.716 65 110 58.2843 110 50Z"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="currentColor"
            fillOpacity="0.08"
            className="opacity-40"
          />
        </svg>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col gap-3.5 pr-8">
        {/* Top Label */}
        <MemoryLabel text={label} />

        {/* Hero Primary Statement */}
        <h2 className="font-serif text-[24px] text-primaryText font-normal leading-tight tracking-tight max-w-none">
          {statement}
        </h2>

        {/* Supporting Copy — wraps within a narrower column so it stays off the right edge. */}
        <p className="font-sans text-[14px] text-secondaryText font-normal leading-relaxed max-w-[85%]">
          {supportingCopy}
        </p>

        {/* Primary Action Right/Left Aligned per spec ("Explore thread →") */}
        <div className="pt-1.5 flex justify-start">
          <TextAction
            onClick={onExploreThread}
            icon={<ArrowRight className="w-4 h-4 ml-1 stroke-[1.8]" />}
          >
            {actionText}
          </TextAction>
        </div>
      </div>
    </div>
  );
};
