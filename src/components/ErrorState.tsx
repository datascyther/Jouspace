import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Please try again.',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-errorBg flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-error stroke-[1.6]" />
      </div>
      <h3 className="font-sans text-[16px] font-medium text-primaryText mb-1.5">
        {title}
      </h3>
      <p className="font-sans text-[14px] text-secondaryText leading-relaxed mb-5 max-w-[260px]">
        {message}
      </p>
    </div>
  );
};
