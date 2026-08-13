import React from 'react';
import { BrandedSpinner } from './Skeleton';

interface SplashScreenProps {
  className?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ className = '' }) => {
  return (
    <div
      className={`min-h-full w-full flex flex-col items-center justify-center animate-fadeIn ${className}`}
    >
      {/* Branded cold-start spinner — shown while the app is waking up. */}
      <BrandedSpinner />
    </div>
  );
};
