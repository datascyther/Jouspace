import React from 'react';
import { Pencil } from 'lucide-react';

interface PrimaryButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children = 'Continue writing',
  onClick,
  className = '',
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center bg-[#6D4FD7] hover:bg-[#5C3EC5] active:bg-[#5034B3] text-white font-sans font-medium text-[14.5px] px-5 py-3.5 rounded-[16px] transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6D4FD7]/40 cursor-pointer ${className}`}
    >
      {icon ?? <Pencil className="w-[18px] h-[18px] mr-2.5 stroke-[1.8]" />}
      <span>{children}</span>
    </button>
  );
};
