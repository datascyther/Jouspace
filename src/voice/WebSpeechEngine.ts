import type { SttEngine, SttEngineCallbacks } from './types';

function getCtor(): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Legacy browser Web Speech API engine. Kept as an OPTIONAL fallback.
 *
 * WARNING: this is NOT private — audio is sent to the browser vendor's speech
 * service (Google for Chromium). Only enable via `allowWebSpeechFallback` for
 * local/dev convenience; disable it before shipping a privacy-first build.
 */
export class WebSpeechEngine implements SttEngine {
  readonly id = 'web-speech' as const;
  readonly supported: boolean;
  private rec: any = null;
  private cb: SttEngineCallbacks = {};

  constructor() {
    this.supported = getCtor() !== null;
  }

  setCallbacks(cb: SttEngineCallbacks): void {
    this.cb = cb;
  }

  async load(): Promise<void> {
    /* Nothing to preload for Web Speech. */
  }

  async start(opts: { lang?: string } = {}): Promise<void> {
    const Ctor = getCtor();
    if (!Ctor) {
      this.cb.onError?.('not-supported');
      return;
    }
    const rec = new Ctor();
    rec.lang = opts.lang ?? 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) this.cb.onResult?.(text, true, i);
        else this.cb.onInterim?.(text);
      }
    };
    rec.onerror = (e: any) => this.cb.onError?.(e?.error ?? 'unknown');
    rec.onend = () => this.cb.onEnd?.();
    rec.onstart = () => this.cb.onStart?.();
    this.rec = rec;
    rec.start();
  }

  stop(): void {
    try {
      this.rec?.stop();
    } catch {
      /* ignore */
    }
    // The hook owns onStop (driven by the engine's onend), so we don't call it here.
  }
}
