import React from 'react';
import { MemoryLabel } from './MemoryLabel';
import { TextAction } from './TextAction';
import { ChevronRight } from 'lucide-react';

interface MemoryContextCardProps {
  label?: string;
  threads?: string[];
  actionText?: string;
  onChangeContext?: () => void;
  isEmptyContext?: boolean;
  /** When set, shows the user-chosen context instead of derived threads. */
  contextLabel?: string | null;
  className?: string;
}

export const MemoryContextCard: React.FC<MemoryContextCardProps> = ({
  label = 'Using your memory',
  threads = ['clarity', 'discipline', 'starting again'],
  actionText = 'Change context',
  onChangeContext,
  isEmptyContext = false,
  contextLabel = null,
  className = '',
}) => {
  return (
    <div
      className={`bg-surface rounded-3xl border border-borderSubtle p-6 text-primaryText flex flex-col gap-3 ${className}`}
    >
      {/* Top Label */}
      <MemoryLabel text={label} />

      {/* Editorial Body: Recent threads */}
      <p className="font-serif text-[19px] leading-[1.4] text-primaryText font-normal tracking-tight">
        {contextLabel
          ? `Focusing on ${contextLabel}.`
          : isEmptyContext
            ? 'No memory threads selected yet.'
            : `Recent threads: ${threads.join(', ')}`}
      </p>

      {/* Text-only action */}
      <div className="pt-1 flex justify-start">
        <TextAction
          onClick={onChangeContext}
          icon={<ChevronRight className="w-4 h-4 ml-0.5 stroke-[1.8]" />}
        >
          {actionText}
        </TextAction>
      </div>
    </div>
  );
};
