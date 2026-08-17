/**
 * Engine-agnostic Speech-to-Text contract.
 *
 * `useVoiceInput` talks only to this interface, so the underlying engine can be
 * swapped (on-device Whisper, Web Speech, or none) without touching the UI. All
 * audio for the default engine stays on-device — nothing is sent to a third
 * party, which is what makes voice typing private and interruption-free (no
 * network round-trip that can fail mid-dictation).
 */

export type SttEngineId = 'native-speech' | 'web-speech' | 'none';

export interface SttEngineCallbacks {
  /** A finalized transcript segment. `index` lets the consumer de-duplicate. */
  onResult?: (text: string, isFinal: boolean, index: number) => void;
  /** Live, uncommitted preview (or null to clear). May be called often. */
  onInterim?: (text: string | null) => void;
  /** Engine-level error code (e.g. 'audio-capture', 'not-allowed', 'network'). */
  onError?: (code: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  /** Fired when a recognition session ends (silence, manual stop, or error). */
  onEnd?: () => void;
}

export interface SttEngine {
  readonly id: SttEngineId;
  /** Whether this engine can be used at all in the current environment. */
  readonly supported: boolean;
  /** Load model/resources. Idempotent. Rejects if unavailable (e.g. model missing). */
  load(): Promise<void>;
  /** Begin a recognition session. Resolves once started; emits via callbacks. */
  start(opts: { lang?: string }): Promise<void>;
  /** End the active session. */
  stop(): void;
  setCallbacks(cb: SttEngineCallbacks): void;
}
