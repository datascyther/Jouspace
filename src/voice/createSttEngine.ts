import type { SttEngine } from './types';
import { NativeSpeechEngine } from './NativeSpeechEngine';
import { WebSpeechEngine } from './WebSpeechEngine';
import { NullEngine } from './NullEngine';
import { voiceConfig } from './voiceConfig';
import { isNativeRuntime } from '../lib/speechRecognitionPlugin';

export type SttEngineFactory = () => SttEngine;

/** Build the STT engine for the current environment based on `voiceConfig`. */
export const defaultSttEngineFactory: SttEngineFactory = () => {
  const want = voiceConfig.engine;

  if (want === 'native') {
    const eng = new NativeSpeechEngine();
    return eng.supported ? eng : new NullEngine();
  }
  if (want === 'web-speech') {
    const eng = new WebSpeechEngine();
    return eng.supported ? eng : new NullEngine();
  }

  // 'auto': prefer the native recognizer on Android, else Web Speech.
  if (isNativeRuntime()) {
    const eng = new NativeSpeechEngine();
    if (eng.supported) return eng;
  }
  const web = new WebSpeechEngine();
  if (web.supported) return web;
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
