import React from 'react';
import { Pencil } from 'lucide-react';

interface PrimaryButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children = 'Continue writing',
  onClick,
  className = '',
  icon,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={isLoading ? 'true' : undefined}
      className={`inline-flex items-center justify-center bg-accent hover:bg-[#5C3EC5] active:bg-[#5034B3] text-white font-sans font-medium text-[14.5px] px-5 py-3.5 rounded-2xl transition-all duration-150 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent cursor-pointer min-h-11 ${className}`}
    >
      {isLoading ? (
        <svg className="w-[18px] h-[18px] mr-2.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : icon ?? <Pencil className="w-[18px] h-[18px] mr-2.5 stroke-[1.8]" />}
      <span>{children}</span>
    </button>
  );
};
