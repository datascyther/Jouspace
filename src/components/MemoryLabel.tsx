import React from 'react';

interface MemoryLabelProps {
  text: string;
  className?: string;
}

export const MemoryLabel: React.FC<MemoryLabelProps> = ({ text, className = '' }) => {
  // Strip '✦' if included in text prop so we render the precise vector icon + text label cleanly
  const labelText = text.replace(/^✦\s*/, '');

  return (
    <div className={`flex items-center gap-1.5 text-accent font-sans text-[13.5px] font-medium leading-none ${className}`}>
      {/* Precision 4-pointed star outline matching reference UI */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-accent"
      >
        <path
          d="M8 1C8 4.866 4.866 8 1 8C4.866 8 8 11.134 8 15C8 11.134 11.134 8 15 8C11.134 8 8 4.866 8 1Z"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
      </svg>
      <span>{labelText}</span>
    </div>
  );
};
