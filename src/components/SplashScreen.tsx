import React from 'react';
import logoSrc from '../assets/Jouspace logo.png';

interface SplashScreenProps {
  className?: string;
  /** DEV ONLY — bypass auth and enter as a local guest immediately. */
  onGuestContinue?: () => void;
}

/**
 * Cold-start splash. Shows the brand logo mark above the wordmark while the
 * app wakes up. The logo is the real asset — never a CSS/SVG approximation.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ className = '', onGuestContinue }) => {
    return (
        <div
            className={`relative h-full w-full flex flex-col items-center justify-center overflow-hidden overscroll-none select-none touch-none ${className}`}
        >
            <div className="relative flex flex-col items-center gap-5">
                <div className="relative">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.30),transparent_70%)] blur-xl"
                    />
                    <img
                        src={logoSrc}
                        alt=""
                        aria-hidden="true"
                        className="relative h-28 w-28 rounded-full object-cover shadow-[0_0_28px_-2px_rgba(108,77,202,0.6)] ring-1 ring-white/30 rise-in rise-1 sm:h-36 sm:w-36"
                    />
                </div>
                <span className="font-serif text-[34px] tracking-[-0.3px] text-primaryText rise-in rise-2">
                    Jouspace
                </span>
                <span className="font-sans text-[13px] tracking-wide text-muted rise-in rise-3">
                    Your quiet space to think.
                </span>
            </div>

            {/* DEV ONLY — skip the 3-second wait and auth gate */}
            {import.meta.env.DEV && onGuestContinue && (
                <button
                    type="button"
                    onClick={onGuestContinue}
                    className="absolute bottom-8 text-[13px] font-medium text-muted/60 hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded px-3 py-1"
                >
                    Continue as guest
                </button>
            )}
        </div>
    );
};
