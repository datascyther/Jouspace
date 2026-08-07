import React from 'react';
import { MemoryLabel } from './MemoryLabel';
import { TextAction } from './TextAction';
import { ArrowRight } from 'lucide-react';

interface MemoryThreadCardProps {
  label?: string;
  bodyText?: string;
  actionText?: string;
  onUseThread?: () => void;
  className?: string;
}

export const MemoryThreadCard: React.FC<MemoryThreadCardProps> = ({
  label = 'Memory thread',
  bodyText = "You've written about building Jouspace with less noise and more clarity several times this week.",
  actionText = 'Use this thread',
  onUseThread,
  className = '',
}) => {
  return (
    <div
      className={`bg-surface rounded-[24px] border border-border p-6 text-primaryText flex flex-col gap-4 transition-all duration-200 ${className}`}
    >
      {/* Top label */}
      <MemoryLabel text={label} />

      {/* Body text in quiet editorial style */}
      <p className="font-sans text-[14.5px] leading-[1.6] text-primaryText font-normal">
        {bodyText}
      </p>

      {/* Bottom action right-aligned */}
      <div className="flex justify-end pt-1">
        <TextAction
          onClick={onUseThread}
          icon={<ArrowRight className="w-4 h-4 ml-1 stroke-[1.8]" />}
        >
          {actionText}
        </TextAction>
      </div>
    </div>
  );
};
