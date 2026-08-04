import { useEffect, useRef, useCallback } from 'react';

type SpeechEventMap = {
  result: (event: { results: { transcript: string }[] }) => void;
  error: (event: { error: string; message: string }) => void;
  end: () => void;
  volumechange: (event: { value: number }) => void;
};

type RecognitionOptions = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  addsPunctuation: boolean;
  iosTaskHint: string;
  contextualStrings: string[];
  volumeChangeEventOptions: { enabled: boolean; intervalMillis: number };
};

let NativeModule: any = null;
let useNativeEventHook: any = null;

try {
  const mod = require('expo-speech-recognition');
  NativeModule = mod.ExpoSpeechRecognitionModule;
  useNativeEventHook = mod.useSpeechRecognitionEvent;
} catch {
  // Native module not available
}

export const speechRecognitionAvailable = NativeModule != null;

function noop() {}

/**
 * Wraps expo-speech-recognition's hook so it's always called at top level
 * (satisfying Rules of Hooks) but is a no-op when the native module is missing.
 */
export function useSpeechRecognitionEvent<K extends keyof SpeechEventMap>(
  event: K,
  handler: SpeechEventMap[K]
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback(
    (...args: any[]) => (handlerRef.current as any)(...args),
    []
  );

  if (useNativeEventHook && speechRecognitionAvailable) {
    // Always call the hook unconditionally at top level — this is allowed.
    // The original hook returns a cleanup function, which we ignore since
    // we manage listener lifecycle via handlerRef indirection.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useNativeEventHook(event, stableHandler);
  } else {
    // No-op: still call useEffect to keep hook count consistent
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(noop, [event]);
  }
}

export async function requestSpeechPermission(): Promise<boolean> {
  if (!NativeModule) return false;
  try {
    const result = await NativeModule.requestPermissionsAsync();
    return result.granted ?? false;
  } catch {
    return false;
  }
}

export function startSpeechRecognition(options: RecognitionOptions) {
  if (!NativeModule) return;
  try {
    NativeModule.start(options);
  } catch {
    // silently fail
  }
}

export function stopSpeechRecognition() {
  if (!NativeModule) return;
  try { NativeModule.stop(); } catch {}
}

export function abortSpeechRecognition() {
  if (!NativeModule) return;
  try { NativeModule.abort(); } catch {}
}

export type { SpeechEventMap };
