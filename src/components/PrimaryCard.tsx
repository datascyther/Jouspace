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
      className={`bg-surface rounded-[24px] border border-border p-6 text-primaryText ${
        onClick ? 'cursor-pointer hover:border-accent/40 transition-colors duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
