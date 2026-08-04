// `ErrorUtils` is a React Native global; reference it via `global` to avoid the
// named-export/type-only conflict and the global name collision.
const RNErrorUtils: {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
} | undefined = (global as any).ErrorUtils;

export interface FatalErrorInfo {
  message: string;
  stack?: string;
  fatal: boolean;
  source: 'errorutils' | 'unhandledrejection';
}

let current: FatalErrorInfo | null = null;
const listeners = new Set<() => void>();

function emit(info: FatalErrorInfo) {
  // Keep the first error so we don't get stomped by cascading handlers.
  if (!current) current = info;
  listeners.forEach((l) => l());
}

export function getFatalError(): FatalErrorInfo | null {
  return current;
}

export function clearFatalError(): void {
  current = null;
  listeners.forEach((l) => l());
}

export function subscribeFatalError(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

let installed = false;

export function installGlobalErrorHandler(): void {
  if (installed) return;
  installed = true;

  try {
    const prev = RNErrorUtils.getGlobalHandler();
    RNErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      const e = error instanceof Error ? error : new Error(String(error));
      emit({ message: e.message, stack: e.stack, fatal: !!isFatal, source: 'errorutils' });
      // Don't re-invoke RN's default fatal handler: on Android it terminates the
      // process (the "guest auto-close"). The <CrashOverlay/> now surfaces the
      // real cause on-screen so we can read it instead of the app dying.
      if (typeof prev === 'function' && !isFatal) {
        try {
          prev(error, isFatal);
        } catch {
          /* ignore */
        }
      }
    });
  } catch {
    /* ErrorUtils unavailable */
  }

  const g = global as unknown as {
    addEventListener?: (type: string, cb: (ev: any) => void) => void;
  };
  if (typeof g.addEventListener === 'function') {
    g.addEventListener('unhandledrejection', (ev: any) => {
      const reason = ev?.reason;
      const e = reason instanceof Error ? reason : new Error(String(reason));
      emit({ message: e.message, stack: e.stack, fatal: false, source: 'unhandledrejection' });
    });
  }
}
