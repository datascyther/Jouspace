import React from 'react';

interface PrimaryCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const PrimaryCard: React.FC<PrimaryCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#FFFEFC] rounded-[24px] border border-[#E7E1EF] p-6 text-[#0D102B] ${
        onClick ? 'cursor-pointer hover:border-[#6D4FD7]/40 transition-colors duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
