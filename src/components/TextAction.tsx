import React from 'react';

interface TextActionProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  alignRight?: boolean;
}

export const TextAction: React.FC<TextActionProps> = ({
  children,
  onClick,
  className = '',
  icon,
  alignRight = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center text-[#6D4FD7] hover:text-[#5639BE] font-sans font-medium text-[14.5px] transition-colors duration-150 focus:outline-none focus:underline cursor-pointer ${
        alignRight ? 'ml-auto' : ''
      } ${className}`}
    >
      <span>{children}</span>
      {icon && <span className="ml-1">{icon}</span>}
    </button>
  );
};
