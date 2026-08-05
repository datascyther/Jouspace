import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  badge?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  ariaLabel,
  badge,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative p-2 text-[#0D102B] hover:text-[#6D4FD7] rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#6D4FD7]/20 ${className}`}
    >
      {icon}
      {badge && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6D4FD7]" />
      )}
    </button>
  );
};
