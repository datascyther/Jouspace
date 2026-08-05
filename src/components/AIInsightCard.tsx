import React from 'react';
import { PrimaryCard } from './PrimaryCard';
import { MemoryLabel } from './MemoryLabel';
import { TextAction } from './TextAction';
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
    <PrimaryCard className={`flex flex-col gap-4 ${className}`}>
      {/* Top Label */}
      <MemoryLabel text={label} />

      {/* Body text in Editorial Serif Font */}
      <p className="font-serif text-[17.5px] leading-[1.45] text-[#0D102B] font-normal tracking-tight pr-2">
        {insightText}
      </p>

      {/* Bottom Action Right Aligned */}
      <div className="flex justify-end pt-1">
        <TextAction
          onClick={onReflect}
          icon={<ArrowRight className="w-4 h-4 ml-1 stroke-[1.8]" />}
        >
          Reflect with AI
        </TextAction>
      </div>
    </PrimaryCard>
  );
};
