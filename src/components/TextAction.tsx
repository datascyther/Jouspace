import React from 'react';

interface TextActionProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  alignRight?: boolean;
  disabled?: boolean;
}

export const TextAction: React.FC<TextActionProps> = ({
  children,
  onClick,
  className = '',
  icon,
  alignRight = false,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center text-accent hover:text-[#5639BE] font-sans font-medium text-[14.5px] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-11 px-2 ${
        alignRight ? 'ml-auto' : ''
      } ${className}`}
    >
      <span>{children}</span>
      {icon && <span className="ml-1">{icon}</span>}
    </button>
  );
};
