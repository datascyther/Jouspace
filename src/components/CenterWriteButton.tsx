import React from 'react';
import { Pencil } from 'lucide-react';

interface CenterWriteButtonProps {
  onClick?: () => void;
  className?: string;
}

export const CenterWriteButton: React.FC<CenterWriteButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Write new journal entry"
      className={`relative -top-4 flex items-center justify-center w-[52px] h-[52px] bg-[#6D4FD7] hover:bg-[#5C3EC5] active:scale-95 text-white rounded-full shadow-md shadow-[#6D4FD7]/25 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#6D4FD7]/20 cursor-pointer ${className}`}
    >
      <Pencil className="w-5 h-5 stroke-[1.8]" />
    </button>
  );
};
