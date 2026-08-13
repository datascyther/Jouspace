import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render/runtime errors anywhere below it so a single bad surface
 * (e.g. a failed AI reflection) shows a recoverable fallback instead of a
 * blank white screen.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    // TODO: surface the error to an error-monitoring service (e.g. Sentry)
    // once one is wired up, instead of only logging to the console.
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-base flex items-center justify-center px-6">
          <div className="max-w-sm w-full bg-surface border border-borderSubtle rounded-3xl p-6 flex flex-col gap-4 text-center">
            <h1 className="font-serif text-[22px] text-primaryText">
              Something went wrong
            </h1>
            <p className="font-sans text-[14px] text-secondaryText leading-relaxed">
              Please reload the app to continue.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="bg-accent hover:bg-accentHover text-white font-sans text-sm font-medium px-5 py-2.5 rounded-[14px] transition-all cursor-pointer"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
