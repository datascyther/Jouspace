import React from 'react';
import logoSrc from '../assets/Jouspace logo.png';

interface SplashScreenProps {
  className?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ className = '' }) => {
  return (
    <div
      className={`min-h-full w-full bg-background flex flex-col items-center justify-center animate-fadeIn ${className}`}
    >
      {/* Logo Mark */}
      <img src={logoSrc} alt="Jouspace" className="w-16 h-16 rounded-full mb-5 shadow-sm object-cover" />

      {/* Editorial Wordmark */}
      <span className="font-serif font-medium text-[28px] text-primaryText tracking-tight select-none">
        Jouspace
      </span>
    </div>
  );
};
