import type { SttEngine } from './types';

/** Used when no engine is available (e.g. private mode with no fallback). */
export class NullEngine implements SttEngine {
  readonly id = 'none' as const;
  readonly supported = false;
  setCallbacks(): void {}
  async load(): Promise<void> {}
  async start(): Promise<void> {
    /* no-op */
  }
  stop(): void {
    /* no-op */
  }
}
