import type { SttEngine } from './types';
import { LocalWhisperEngine } from './LocalWhisperEngine';
import { WebSpeechEngine } from './WebSpeechEngine';
import { NullEngine } from './NullEngine';
import { voiceConfig } from './voiceConfig';

export type SttEngineFactory = () => SttEngine;

/** Build the STT engine for the current environment based on `voiceConfig`. */
export const defaultSttEngineFactory: SttEngineFactory = () => {
  if (voiceConfig.engine === 'local-whisper') {
    const eng = new LocalWhisperEngine(voiceConfig.whisper);
    if (eng.supported) return eng;
    if (voiceConfig.allowWebSpeechFallback) return new WebSpeechEngine();
    return new NullEngine();
  }
  // Explicit web-speech engine.
  if (
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  ) {
    return new WebSpeechEngine();
  }
  return new NullEngine();
};

let cached: SttEngine | null = null;

/** Returns the shared engine instance (created lazily). */
export function getSttEngine(): SttEngine {
  if (!cached) cached = defaultSttEngineFactory();
  return cached;
}

/** Test helper: inject a factory (or clear the cache). */
export function resetSttEngineForTests(factory?: SttEngineFactory): void {
  cached = factory ? factory() : null;
}
