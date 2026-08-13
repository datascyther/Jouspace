import type { SttEngineCallbacks } from './types';

/** A message posted by the whisper.wasm worker. Shape varies slightly by
 *  package version; we read defensively. */
export interface WhisperEvent {
  status?: string;
  data?: any;
}

/**
 * Translate a whisper.wasm worker message into our engine callbacks.
 *
 * Kept as a pure function so it can be unit-tested without the WASM runtime.
 * Expected statuses:
 *   - 'partial'  → interim preview (onInterim)
 *   - 'result'   → finalized segment (onResult, isFinal=true)
 *   - 'error'    → onError
 *   - 'end'/'done' → onEnd
 */
export function handleWhisperEvent(cb: SttEngineCallbacks, ev: WhisperEvent): void {
  switch (ev.status) {
    case 'partial': {
      const text =
        typeof ev.data === 'string' ? ev.data : (ev.data?.partial ?? null);
      cb.onInterim?.(text);
      break;
    }
    case 'result': {
      const text =
        typeof ev.data === 'string'
          ? ev.data
          : (ev.data?.result ?? ev.data?.text ?? '');
      const index = typeof ev.data?.id === 'number' ? ev.data.id : -1;
      cb.onResult?.(text, true, index);
      break;
    }
    case 'error':
      cb.onError?.(
        typeof ev.data === 'string' ? ev.data : (ev.data?.message ?? 'whisper-error'),
      );
      break;
    case 'end':
    case 'done':
      cb.onEnd?.();
      break;
    default:
      break;
  }
}
