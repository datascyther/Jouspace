import type { SttEngine, SttEngineCallbacks } from './types';
import { getSpeechPlugin, isNativeRuntime, type SpeechPlugin } from '../lib/speechRecognitionPlugin';

/**
 * Android speech-to-text via `@capacitor-community/speech-recognition`
 * (the OS `SpeechRecognizer`). This is the engine used inside the native
 * Capacitor shell; on the desktop web build `supported` is false and the
 * app falls back to `WebSpeechEngine`.
 *
 * Privacy note: on Android the audio is sent to the device's speech-recognition
 * service (typically Google's) for transcription. That is the platform's own
 * recognizer — no audio or transcript is sent to any Jouspace server.
 *
 * Recognizer contract (verified against the plugin v6.0.1):
 *  - `start({ partialResults: true, popup: false })` resolves immediately and
 *    streams via listeners (a late `listeningState:'started'` flips the UI).
 *  - `available()` can reject on some builds, so `load()` treats a throw as
 *    "speech-unavailable" rather than an uncaught rejection.
 *  - `popup: true` disables partial results on Android, so it must stay false.
 */
export class NativeSpeechEngine implements SttEngine {
  readonly id = 'native-speech' as const;
  readonly supported: boolean = isNativeRuntime();

  private plugin: SpeechPlugin | null = null;
  private cb: SttEngineCallbacks = {};
  private loading: Promise<void> | null = null;
  private ready = false;

  // Per-session state, reset at the top of every `start`.
  private pendingText = '';
  private resultIndex = -1;
  private finishedThisSession = true;

  setCallbacks(cb: SttEngineCallbacks): void {
    this.cb = cb;
  }

  async load(): Promise<void> {
    if (this.ready) return;
    if (this.loading) return this.loading;
    this.loading = this.doLoad().then(
      () => {
        this.ready = true;
      },
      (err) => {
        this.loading = null; // allow a later retry
        throw err;
      },
    );
    return this.loading;
  }

  private async doLoad(): Promise<void> {
    const p = await getSpeechPlugin();
    if (!p) throw new Error('speech-unavailable');
    let available = false;
    try {
      const res = await p.available();
      available = !!res?.available;
    } catch {
      // Some Android builds reject instead of returning {available:false}.
      available = false;
    }
    if (!available) throw new Error('speech-unavailable');
    this.plugin = p;
  }

  async start(opts: { lang?: string } = {}): Promise<void> {
    const p = this.plugin ?? (await getSpeechPlugin());
    if (!p) throw new Error('speech-unavailable');
    this.plugin = p;
    if (!this.ready) await this.load();

    // Re-entrancy guard: tear down any prior session's listeners and state
    // BEFORE awaiting, so a late 'stopped' from a previous session can't fire a
    // second onEnd or double-register listeners.
    try {
      await p.removeAllListeners();
    } catch {
      /* ignore */
    }
    this.pendingText = '';
    this.resultIndex += 1;
    this.finishedThisSession = false;

    p.addListener('partialResults', (d) => {
      const t = d?.matches?.[0];
      if (t) {
        this.pendingText = t;
        this.cb.onInterim?.(t);
      }
    }).catch(() => {});

    p.addListener('listeningState', (d) => {
      if (d?.status === 'started') this.cb.onStart?.();
      else this.finishSession();
    }).catch(() => {});

    await p.start({
      language: opts.lang ?? 'en-US',
      maxResults: 1,
      partialResults: true,
      popup: false,
    });
  }

  stop(): void {
    // Tell the recognizer to stop, then commit whatever we have. The native
    // `stop()` resolves a promise; swallow any error (already stopped, etc.).
    if (this.plugin) {
      try {
        void this.plugin.stop();
      } catch {
        /* ignore */
      }
    }
    this.finishSession();
  }

  /**
   * Idempotent session teardown. Commits the last heard phrase exactly once,
   * clears the interim preview, detaches listeners, and ends the session. Safe
   * to call more than once (calls after the first are no-ops until next start).
   */
  private finishSession(): void {
    if (this.finishedThisSession) return;
    this.finishedThisSession = true;

    if (this.pendingText) {
      this.cb.onResult?.(this.pendingText, true, this.resultIndex);
    }
    this.pendingText = '';
    this.cb.onInterim?.(null);

    if (this.plugin) {
      try {
        void this.plugin.removeAllListeners();
      } catch {
        /* ignore */
      }
    }
    this.cb.onEnd?.();
  }
}
