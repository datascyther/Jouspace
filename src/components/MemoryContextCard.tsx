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
  className?: string;
}

export const MemoryContextCard: React.FC<MemoryContextCardProps> = ({
  label = 'Using your memory',
  threads = ['clarity', 'discipline', 'starting again'],
  actionText = 'Change context',
  onChangeContext,
  isEmptyContext = false,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 text-[#0D102B] flex flex-col gap-3 ${className}`}
    >
      {/* Top Label */}
      <MemoryLabel text={label} />

      {/* Editorial Body: Recent threads */}
      <p className="font-serif text-[19px] sm:text-[20px] leading-[1.4] text-[#0D102B] font-normal tracking-tight">
        {isEmptyContext
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
