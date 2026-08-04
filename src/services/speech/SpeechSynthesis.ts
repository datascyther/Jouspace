import { Platform } from 'react-native';

// ─── Native module (expo-speech) ──────────────────────────────────────────────
// NOTE: `expo-speech` is NOT yet a dependency. Add it before running on native:
//   npx expo install expo-speech
let NativeSpeech: any = null;

try {
  const mod = require('expo-speech');
  NativeSpeech = mod.Speech;
} catch {
  // Native TTS module not available (e.g. web, or not installed yet).
}

// ─── Web capability ───────────────────────────────────────────────────────────
const isWeb = Platform.OS === 'web';
const webSpeechAvailable =
  isWeb &&
  typeof window !== 'undefined' &&
  typeof (window as any).speechSynthesis !== 'undefined';

export const speechSynthesisAvailable: boolean =
  NativeSpeech != null || webSpeechAvailable;

function noop() {}

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (e: unknown) => void;
}

function getWebVoice(voiceURI?: string) {
  if (!voiceURI) return undefined;
  try {
    const voices = (window as any).speechSynthesis.getVoices();
    return voices.find((v: any) => v.voiceURI === voiceURI) || undefined;
  } catch {
    return undefined;
  }
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!text) return;
  if (!speechSynthesisAvailable) return;

  const rate = opts.rate ?? 0.9;
  const pitch = opts.pitch ?? 1.0;

  if (NativeSpeech) {
    try {
      NativeSpeech.speak(text, {
        rate,
        pitch,
        onStart: opts.onStart,
        onDone: opts.onDone,
        onError: opts.onError,
      });
    } catch {
      // silently fail — TTS is best-effort
    }
    return;
  }

  if (webSpeechAvailable) {
    try {
      const synth = (window as any).speechSynthesis as SpeechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      const voice = getWebVoice(opts.voiceURI);
      if (voice) utterance.voice = voice;
      if (opts.onStart) utterance.onstart = () => opts.onStart!();
      if (opts.onDone) utterance.onend = () => opts.onDone!();
      if (opts.onError) utterance.onerror = (e: any) => opts.onError!(e);
      synth.speak(utterance);
    } catch {
      // silently fail
    }
    return;
  }
}

export function stop(): void {
  if (NativeSpeech) {
    try {
      NativeSpeech.stop();
    } catch {
      // nothing speaking — safe no-op
    }
    return;
  }

  if (webSpeechAvailable) {
    try {
      (window as any).speechSynthesis.cancel();
    } catch {
      // nothing speaking — safe no-op
    }
    return;
  }
}

export default { speechSynthesisAvailable, speak, stop, noop };
