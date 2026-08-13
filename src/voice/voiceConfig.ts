/**
 * Voice configuration. Everything here is about keeping voice input PRIVATE:
 * the default engine runs Whisper fully on-device (WASM) and the model is served
 * from your own infrastructure, so audio never leaves the user's device.
 */
export interface WhisperConfig {
  /** HuggingFace model name used as a fallback (e.g. 'base.en'). */
  model: string;
  /** Self-hosted model URL (PRIVATE). If set, it takes precedence over `model`.
   *  Serve this from your own runtime/CDN you control — do not point at a public
   *  third-party CDN if you want to stay private. */
  modelUrl?: string;
  /** Self-hosted path/dir for the wasm binaries (PRIVATE). */
  wasmUrl?: string;
  multilingual: boolean;
}

export interface VoiceConfig {
  /** Preferred engine. 'local-whisper' keeps audio on-device. */
  engine: 'local-whisper' | 'web-speech';
  whisper: WhisperConfig;
  /**
   * If the preferred engine cannot be created, fall back to Web Speech.
   * Web Speech is NOT private (sends audio to the browser vendor). Keep `false`
   * for strict privacy; enable only for local/dev convenience and disable before
   * shipping.
   */
  allowWebSpeechFallback: boolean;
  /**
   * Preload the local model in the background once the voice hook mounts, so the
   * first tap is instant. Set `false` to load lazily on first use instead.
   */
  preloadOnMount: boolean;
}

export const voiceConfig: VoiceConfig = {
  engine: 'local-whisper',
  whisper: {
    model: 'base.en',
    // Host these on YOUR OWN runtime/infra so audio never leaves your control.
    // Example: serve the ggml model + wasm from `server/public/models/`.
    modelUrl: '/models/whisper-base-en.wasm',
    wasmUrl: '/models/',
    multilingual: false,
  },
  allowWebSpeechFallback: false,
  preloadOnMount: true,
};

/** One-time setup hint shown when the private model can't be loaded. */
export const VOICE_MODEL_MISSING_HINT =
  'Private voice model is unavailable. Host the Whisper model on your runtime ' +
  '(see src/voice/voiceConfig.ts) and reload.';
