import React from 'react';
import { AppBackground } from './AppBackground';

interface AppScreenProps {
  children: React.ReactNode;
  className?: string;
  isOffline?: boolean;
  /** Overlays (modals/drawers/toasts) rendered INSIDE the phone frame so their
   *  backdrops are clipped to the app container instead of the browser viewport. */
  overlays?: React.ReactNode;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  className = '',
  isOffline = false,
  overlays,
}) => {
  return (
    <div className="w-full flex flex-col items-center selection:bg-accent/15">
      {isOffline && (
        <div className="w-full max-w-[430px] bg-primaryText text-background text-[12px] font-sans py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 transition-all">
          <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
          <span>Offline mode — your journal entries are saved locally</span>
        </div>
      )}

      {/* Mobile Prison — single centered column, max 430px.
          Fills the viewport on mobile; floats as a phone on desktop.
          Height = the VISIBLE viewport (`--vvh`), driven by useAdaptiveKeyboard.
          Keyboard avoidance is handled at the SCREEN level (the bottom nav is
          hidden and the toolbar/composer sits flush while the software keyboard
          is open), NOT here: resizing the shell with `calc(vvh + kb-height)`
          collapses to `vvh` on platforms that also shrink window.innerHeight
          when the keyboard opens (iOS Safari, Capacitor's adjustResize WebView),
          which made the nav ride up onto the keyboard. Pinning the shell to
          `--vvh` also keeps the background rock-steady when overlays open.
          Screens scroll via their own `flex-1 min-h-0 overflow-y-auto`
          containers. */}
      <div
        className={`relative isolate w-full max-w-[430px] mx-auto h-[var(--vvh)] bg-base flex flex-col overflow-hidden md:h-[880px] md:rounded-[40px] md:border md:border-borderSubtle md:shadow-2xl ${className}`}
      >
        {/* The app's one painted canvas. Everything below must sit at z-10 or
            higher: a positioned z-index:0 layer paints ABOVE in-flow content. */}
        <AppBackground />

        <div className="relative z-10 flex-1 flex flex-col overflow-hidden min-h-0">
          {children}
        </div>

        {/* Overlays rendered inside the frame so they stay clipped to the app */}
        {overlays}
      </div>
    </div>
  );
};
