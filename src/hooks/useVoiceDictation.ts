import { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceInput } from './useVoiceInput';
import { usePermission } from '../permissions/usePermissions';

/** How long an error notice stays on screen before auto-dismissing. */
const DISMISS_MS = 5000;

interface UseVoiceDictationOptions {
  /** Receives each finalized transcript segment. The hook never mutates the
   *  text — the caller appends it (with its own separator logic) so typed text
   *  is preserved. */
  onText: (text: string) => void;
  /** BCP-47 language tag for recognition. */
  lang?: string;
}

export interface UseVoiceDictationResult {
  /** True when an engine is available in this environment. */
  supported: boolean;
  /** True while an active recognition session is running. */
  recording: boolean;
  /** True while the engine is warming up (before the first result). */
  preparing: boolean;
  /** Live, uncommitted preview of what is currently being heard. */
  interim: string;
  /** Current human-readable error/notice, or null. */
  error: string | null;
  /** True when the only path forward is the OS settings screen. */
  canOpenSettings: boolean;
  /** Toggle voice input. */
  onMicPress: () => void;
  /** Open the OS settings screen (native only). */
  openSettings: () => Promise<boolean>;
  /** Stop any active session. */
  stop: () => void;
}

/** Map an engine error code to copy + whether Settings is the remedy. */
function mapEngineError(
  code: string,
): { message: string; settings?: boolean } | null {
  switch (code) {
    case 'no-speech':
      return null;
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        message: 'Microphone permission was denied. Tap the mic to try again.',
        settings: true,
      };
    case 'audio-capture':
      return { message: 'No microphone found for voice input.' };
    case 'network':
      return {
        message:
          'Voice input unavailable — the speech service could not be reached. ' +
          'Check your connection or mic permission and try again.',
      };
    case 'speech-unavailable':
    case 'not-supported':
      return { message: "Voice typing isn't available on this device." };
    case 'idle-timeout':
      return { message: 'Stopped listening — no speech detected. Tap the mic to continue.' };
    default:
      return { message: 'Voice input failed. Tap the mic to try again.' };
  }
}

/**
 * Consolidates microphone-permission gating + speech-to-text into one hook.
 *
 * Both the AI composer and the Journal editor used to duplicate this exact
 * logic; this is the single source of truth. The hook decides *when* to start
 * the engine (only after permission is granted) and owns all voice error copy;
 * the screens keep their own text-append behavior so typed text is preserved.
 *
 * It deliberately never emits the literal "permission blocked" string for
 * `unknown`/`prompt` states — those are treated as "tap the mic to try again".
 */
export function useVoiceDictation(
  options: UseVoiceDictationOptions,
): UseVoiceDictationResult {
  const onTextRef = useRef(options.onText);
  onTextRef.current = options.onText;

  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mic = usePermission('microphone');
  const voice = useVoiceInput({
    lang: options.lang,
    onFinal: (text) => onTextRef.current(text),
    onInterim: (t) => setInterim(t ?? ''),
    onError: (code) => showError(code),
  });

  function showError(code: string): void {
    const mapped = mapEngineError(code);
    if (!mapped) {
      setError(null);
      return;
    }
    setError(mapped.message);
    setCanOpenSettings((prev) => prev || Boolean(mapped?.settings));
    clearDismissTimer();
    dismissTimer.current = setTimeout(() => setError(null), DISMISS_MS);
  }

  function clearDismissTimer(): void {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }

  const onMicPress = useCallback(async () => {
    clearDismissTimer();
    // Toggle off first — before any permission work — so a second tap always stops.
    if (voice.recording) {
      voice.stop();
      return;
    }
    if (!voice.supported) {
      setError("Voice input isn't supported on this device or browser.");
      setCanOpenSettings(false);
      dismissTimer.current = setTimeout(() => setError(null), DISMISS_MS);
      return;
    }
    const res = await mic.ensure();
    if (!res.ok) {
      setCanOpenSettings(false);
      if (res.state === 'deniedPermanently' || res.state === 'restricted') {
        // Identify it as blocked AND surface the explicit Settings action — but
        // never auto-open Settings (that's the silent-redirect anti-pattern).
        setError(
          'Microphone access is blocked. Enable it in your device Settings, then return here.',
        );
        setCanOpenSettings(true);
      } else if (res.state === 'denied') {
        setError('Microphone permission was denied. Tap the mic to try again.');
      } else if (res.state === 'unsupported') {
        setError("Voice typing isn't available on this device.");
      } else {
        // unknown / prompt — never invent a "blocked" message.
        setError(res.reason ?? "Couldn't confirm microphone access. Tap the mic to try again.");
      }
      dismissTimer.current = setTimeout(() => setError(null), DISMISS_MS);
      return;
    }
    setError(null);
    setCanOpenSettings(false);
    voice.preload();
    voice.start();
  }, [voice.recording, voice.supported, voice.stop, voice.preload, voice.start, mic.ensure]);

  const openSettings = useCallback(async (): Promise<boolean> => {
    return mic.openSettings();
  }, [mic.openSettings]);

  // Clear the dismiss timer on unmount so it can't fire after the screen is gone.
  useEffect(() => () => clearDismissTimer(), []);

  return {
    supported: voice.supported,
    recording: voice.recording,
    preparing: voice.status === 'loading',
    interim,
    error,
    canOpenSettings,
    onMicPress,
    openSettings,
    stop: voice.stop,
  };
}
