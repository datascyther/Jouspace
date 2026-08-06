import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  className = '',
}) => {
  return (
    <h2
      className={`font-serif text-[20px] font-normal text-[#0D102B] tracking-tight leading-none select-none ${className}`}
    >
      {children}
    </h2>
  );
};
