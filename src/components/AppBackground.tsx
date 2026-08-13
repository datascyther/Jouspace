import React from 'react';

/**
 * The app's single painted background.
 *
 * Mounted once as the first child of the phone frame and never remounted, so
 * screen changes, overlays, and typing swap content *above* a canvas that
 * never repaints. Non-interactive and hidden from assistive tech.
 *
 * Takes no props by design: the canvas is one flat token colour on every
 * screen in both themes. Anything that varies per screen belongs above it.
 */
export const AppBackground: React.FC = React.memo(() => (
  <div className="app-background" aria-hidden="true" />
));

AppBackground.displayName = 'AppBackground';
