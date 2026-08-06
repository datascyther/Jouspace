import React from 'react';

interface SplashScreenProps {
  className?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ className = '' }) => {
  return (
    <div
      className={`min-h-screen bg-background flex flex-col items-center justify-center animate-fadeIn ${className}`}
    >
      {/* Circular Logo with Serif 'J' */}
      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-5 shadow-sm">
        <span className="font-serif font-medium text-[36px] leading-none text-white select-none pl-px">
          J
        </span>
      </div>

      {/* Editorial Wordmark */}
      <span className="font-serif font-medium text-[28px] text-primaryText tracking-tight select-none">
        Jouspace
      </span>
    </div>
  );
};
