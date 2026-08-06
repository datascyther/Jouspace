import React from 'react';
import { MemoryLabel } from './MemoryLabel';
import { TextAction } from './TextAction';
import { ArrowRight } from 'lucide-react';

interface ReflectionPromptCardProps {
  label?: string;
  promptText?: string;
  actionText?: string;
  onReflect?: () => void;
  className?: string;
}

export const ReflectionPromptCard: React.FC<ReflectionPromptCardProps> = ({
  label = 'Reflection prompt',
  promptText = 'What does clarity usually mean when you write about it?',
  actionText = 'Reflect with AI',
  onReflect,
  className = '',
}) => {
  return (
    <div
      className={`relative bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 text-[#0D102B] overflow-hidden flex flex-col gap-4 shadow-2xs ${className}`}
    >
      {/* Subtle Minimal Pencil Illustration Artwork in Bottom Right */}
      <div className="absolute right-3 bottom-2 w-32 h-24 pointer-events-none select-none opacity-30">
        <svg
          viewBox="0 0 120 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-[#6D4FD7]"
        >
          {/* Subtle paper line */}
          <path
            d="M10 75 Q 40 73, 110 75"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            className="opacity-40"
          />
          {/* Angled minimalist fountain pen / pencil stroke */}
          <path
            d="M100 15 L85 68 L80 72 L78 62 L93 10 Z"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
            fill="none"
            className="opacity-50"
          />
          {/* Nib detail */}
          <path
            d="M80 72 L82 66"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col gap-3.5 pr-12">
        {/* Top Label */}
        <MemoryLabel text={label} />

        {/* Editorial Reflection Question */}
        <h3 className="font-serif text-[18px] text-[#0D102B] font-normal leading-[1.38] tracking-tight">
          {promptText}
        </h3>

        {/* Action Button Right/Left Aligned per spec ("Reflect with AI →") */}
        <div className="pt-1 flex justify-start">
          <TextAction
            onClick={onReflect}
            icon={<ArrowRight className="w-4 h-4 ml-1 stroke-[1.8]" />}
          >
            {actionText}
          </TextAction>
        </div>
      </div>
    </div>
  );
};
