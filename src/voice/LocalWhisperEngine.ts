import type { SttEngine, SttEngineCallbacks } from './types';
import { handleWhisperEvent } from './mapWhisper';
import type { WhisperConfig } from './voiceConfig';

type AnyWorker = {
  postMessage: (m: any) => void;
  terminate?: () => void;
  onmessage?: ((e: any) => void) | null;
};

/** Minimal shape of `@ricky0123/whisper.wasm` we depend on. */
type WhisperModule = {
  createWorker: (opts: any) => Promise<AnyWorker>;
  audio?: {
    Recorder: {
      init: () => Promise<any>;
      start: () => Promise<any>;
      stop: () => void;
      on: (ev: string, cb: (d: any) => void) => void;
    };
  };
};

/**
 * Lazily load the whisper.wasm module. We use a runtime (variable) specifier with
 * `@vite-ignore` so the web build does not require the optional native package to
 * be installed in every environment. On a production Capacitor build where the
 * package IS installed, remove `@vite-ignore` (or switch to a static import) so
 * Vite bundles it. If the package is absent, this returns null and the engine
 * reports unavailable.
 */
async function loadWhisperModule(): Promise<WhisperModule | null> {
  try {
    const spec = '@ricky0123/whisper.wasm';
    return (await import(/* @vite-ignore */ spec)) as unknown as WhisperModule;
  } catch {
    return null;
  }
}

/**
 * Fully on-device Speech-to-Text using a WASM build of Whisper. Audio is captured
 * from the microphone, decoded in the WebView/worker, and never leaves the device
 * — so dictation works offline and can't be interrupted by a network failure.
 *
 * PRIVACY: serve the model + wasm binaries from YOUR OWN runtime (see voiceConfig)
 * rather than a public CDN, so the model fetch is also under your control.
 *
 * NOTE: the exact worker message sequence below targets @ricky0123/whisper.wasm
 * v0.x realtime API. If you pin a different version, verify the `decode`/`flush`/
 * `initialize` message names. The architecture (and tests) are version-independent.
 */
export class LocalWhisperEngine implements SttEngine {
  readonly id = 'local-whisper' as const;
  // Optimistic: we assume the package is configured. `load()` verifies and rejects
  // if the module or model can't be fetched, which the caller surfaces as an error.
  readonly supported = true;

  private cfg: WhisperConfig;
  private worker: AnyWorker | null = null;
  private recorder: any = null;
  private cb: SttEngineCallbacks = {};
  private ready = false;
  private loading: Promise<void> | null = null;
  private streaming = false;

  constructor(cfg: WhisperConfig) {
    this.cfg = cfg;
  }

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
    const mod = await loadWhisperModule();
    if (!mod?.createWorker) throw new Error('whisper-unavailable');

    const model =
      this.cfg.modelUrl && /^(https?:|\/)/.test(this.cfg.modelUrl)
        ? this.cfg.modelUrl
        : this.cfg.model;

    this.worker = await mod.createWorker({
      type: 'wasm',
      model,
      multilingual: this.cfg.multilingual,
      ...(this.cfg.wasmUrl ? { wasmBinaryPath: this.cfg.wasmUrl } : {}),
    });
    this.worker.onmessage = (e: any) => handleWhisperEvent(this.cb, e?.data ?? {});

    await this.postAndAwait(['loaded', 'ready'], { type: 'load', data: { model, multilingual: this.cfg.multilingual } });
    this.ready = true;
  }

  async start(opts: { lang?: string } = {}): Promise<void> {
    if (!this.ready) await this.load();
    const mod = await loadWhisperModule();
    if (!mod?.audio?.Recorder) throw new Error('whisper-audio-unavailable');

    this.cb.onStart?.();
    this.recorder = await mod.audio.Recorder.init();
    this.recorder.on('data', (d: any) => this.worker?.postMessage({ type: 'decode', data: d }));
    await this.recorder.start();

    // Begin realtime decoding. Some versions expect an explicit initialize step.
    this.worker?.postMessage({
      type: 'initialize',
      data: {
        model: this.cfg.model,
        multilingual: this.cfg.multilingual,
        ...(opts.lang ? { language: opts.lang.replace(/[-].*$/, '') } : {}),
      },
    });
    this.streaming = true;
  }

  stop(): void {
    if (!this.streaming) return;
    this.streaming = false;
    try {
      this.recorder?.stop?.();
    } catch {
      /* ignore */
    }
    try {
      this.worker?.postMessage({ type: 'flush', data: {} });
    } catch {
      /* ignore */
    }
    // The hook owns onStop (driven by the engine's terminal 'end' message), so we
    // deliberately do NOT call cb.onStop here to avoid double-firing.
  }

  /** Post a message and resolve when one of `done` statuses is observed. */
  private postAndAwait(
    done: string[],
    message: { type: string; data: any },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error('no-worker'));
      const prev = this.worker.onmessage;
      this.worker.onmessage = (e: any) => {
        const status = e?.data?.status;
        if (status === 'error') {
          this.worker!.onmessage = prev;
          reject(new Error(e.data?.data?.message ?? 'whisper-load-error'));
          return;
        }
        if (status && done.includes(status)) {
          this.worker!.onmessage = prev;
          resolve();
          return;
        }
        prev?.(e);
      };
      this.worker.postMessage(message);
    });
  }
}
