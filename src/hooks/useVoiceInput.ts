import { useCallback, useEffect, useRef, useState } from 'react';
import type { SttEngine, SttEngineCallbacks } from '../voice/types';
import {
  getSttEngine,
  type SttEngineFactory,
} from '../voice/createSttEngine';
import { voiceConfig } from '../voice/voiceConfig';

/** Errors that mean voice input fundamentally cannot work right now (no retry). */
const FATAL_ERRORS = new Set([
  'network',
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'speech-unavailable',
  'not-supported',
]);

/** Engine error codes we recognize and pass through verbatim (else 'voice-failed'). */
const KNOWN_ERRORS = new Set([
  'network',
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'speech-unavailable',
  'not-supported',
  'aborted',
  'no-speech',
  'voice-failed',
]);

/** Max consecutive silent sessions before auto-listening gives up. */
const MAX_EMPTY_SESSIONS = 3;

interface UseVoiceInputOptions {
  /** Receives each newly *finalized* transcript segment exactly once. The
   *  consumer is responsible for inserting/appending it (with spacing). */
  onFinal?: (text: string) => void;
  /** Live, uncommitted preview of what is currently being heard (string), or
   *  `null` when there is no interim text. Great for showing text as you speak. */
  onInterim?: (text: string | null) => void;
  /** Fired once dictation successfully begins. */
  onStart?: () => void;
  /** Fired when dictation ends (explicit stop, natural end, or error). */
  onStop?: () => void;
  /** Fired with an engine error code when recognition fails (e.g. 'network',
   *  'not-allowed', 'speech-unavailable'). Use it to inform the user. */
  onError?: (error: string) => void;
  /** BCP-47 language tag for recognition. Defaults to 'en-US'. */
  lang?: string;
}

export type VoiceStatus = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error';

export interface UseVoiceInputResult {
  /** True when an engine is available in this environment. */
  supported: boolean;
  /** Lifecycle of the underlying engine/model. */
  status: VoiceStatus;
  /** Convenience: `status === 'ready'`. */
  isReady: boolean;
  /** True while an active recognition session is running. */
  recording: boolean;
  /** Begin a recognition session (no-op if unsupported or already running). */
  start: () => void;
  /** End the active session. */
  stop: () => void;
  /** Convenience: start if idle, stop if recording. */
  toggle: () => void;
  /** Warm up the engine/model in the background (no-op if already loaded). */
  preload: () => void;
}

/**
 * Voice-to-text. Uses a pluggable `SttEngine`:
 *   - On Android the native OS recognizer (`NativeSpeechEngine`) transcribes
 *     speech via the device's speech service.
 *   - On the desktop web build (and as a fallback) the browser Web Speech API
 *     (`WebSpeechEngine`) is used.
 *
 * Behaviour:
 * - `onFinal` receives each finalized segment exactly once (deduped by index).
 * - `onInterim` streams a live preview.
 * - In continuous mode the engine may end on silence; benign ends are resumed
 *   automatically so a single tap keeps capturing across natural pauses — but
 *   only up to `MAX_EMPTY_SESSIONS` consecutive silent sessions, after which
 *   listening settles to idle (emitting 'idle-timeout') so it never loops
 *   forever. A fatal error or an explicit stop never resumes.
 * - Latest callbacks are kept in refs so a long-lived session never calls a stale
 *   handler. The session is stopped and released on unmount.
 *
 * The public API (`supported`, `recording`, `start`, `stop`, `toggle`) is
 * unchanged, so existing callers keep working.
 */
export function useVoiceInput(
  options: UseVoiceInputOptions = {},
  engineFactory: SttEngineFactory = getSttEngine,
): UseVoiceInputResult {
  const [supported] = useState(() => engineFactory().supported);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [recording, setRecording] = useState(false);

  const onFinalRef = useRef(options.onFinal);
  const onInterimRef = useRef(options.onInterim);
  const onStartRef = useRef(options.onStart);
  const onStopRef = useRef(options.onStop);
  const onErrorRef = useRef(options.onError);
  onFinalRef.current = options.onFinal;
  onInterimRef.current = options.onInterim;
  onStartRef.current = options.onStart;
  onStopRef.current = options.onStop;
  onErrorRef.current = options.onError;

  const engineRef = useRef<SttEngine | null>(null);
  // Index of the highest result already committed as final (dedupe).
  const lastFinalIndexRef = useRef(-1);
  // True only for an explicit user-initiated stop (so onEnd knows not to resume).
  const manualStopRef = useRef(false);
  // True after a fatal error so onEnd won't retry.
  const fatalRef = useRef(false);
  // True while starting or actively recording (prevents double start).
  const activeRef = useRef(false);
  const recordingRef = useRef(false);
  // Whether the current session committed at least one final segment.
  const sessionHadResultRef = useRef(false);
  // Count of consecutive silent (no-result) sessions; resets to 0 on a result.
  const emptySessionsRef = useRef(0);

  const getEngine = useCallback((): SttEngine | null => {
    if (!engineRef.current) engineRef.current = engineFactory();
    return engineRef.current;
  }, [engineFactory]);

  const setRecordingState = useCallback((v: boolean) => {
    recordingRef.current = v;
    setRecording(v);
  }, []);

  // The benign auto-restart path calls THIS (not the public `start`), so it does
  // NOT reset the empty-session counter — only a real user press does (see start).
  const startAsync = useCallback(async () => {
    const engine = getEngine();
    if (!engine || !engine.supported) {
      setStatus('unsupported');
      onErrorRef.current?.('not-supported');
      return;
    }
    if (activeRef.current) return;
    activeRef.current = true;
    manualStopRef.current = false;
    fatalRef.current = false;
    lastFinalIndexRef.current = -1;
    sessionHadResultRef.current = false;

    const callbacks: SttEngineCallbacks = {
      onStart: () => {
        setRecordingState(true);
        onStartRef.current?.();
      },
      onStop: () => {
        setRecordingState(false);
        onStopRef.current?.();
      },
      onEnd: () => {
        setRecordingState(false);
        onInterimRef.current?.(null);
        const manual = manualStopRef.current;
        const fatal = fatalRef.current;
        manualStopRef.current = false;
        fatalRef.current = false;
        activeRef.current = false;
        if (manual || fatal) {
          onStopRef.current?.();
        } else {
          // Benign end (silence / no-speech) → maybe resume listening.
          if (sessionHadResultRef.current) {
            emptySessionsRef.current = 0;
          } else {
            emptySessionsRef.current += 1;
          }
          if (emptySessionsRef.current >= MAX_EMPTY_SESSIONS) {
            emptySessionsRef.current = 0;
            onErrorRef.current?.('idle-timeout');
            onStopRef.current?.();
          } else {
            startAsync();
          }
        }
      },
      onInterim: (t) => onInterimRef.current?.(t),
      onResult: (text, isFinal, index) => {
        if (isFinal && index > lastFinalIndexRef.current) {
          lastFinalIndexRef.current = index;
          sessionHadResultRef.current = true;
          onFinalRef.current?.(text);
        }
      },
      onError: (code) => {
        const fatal = FATAL_ERRORS.has(code);
        fatalRef.current = fatal;
        if (fatal) manualStopRef.current = true;
        setStatus('error');
        onErrorRef.current?.(code);
      },
    };
    engine.setCallbacks(callbacks);

    try {
      setStatus('loading');
      await engine.load();
      setStatus('ready');
      await engine.start({ lang: options.lang ?? voiceConfig.lang });
    } catch (err: any) {
      activeRef.current = false;
      setStatus('error');
      const msg = err && typeof err.message === 'string' ? err.message : '';
      const code = KNOWN_ERRORS.has(msg) ? msg : 'voice-failed';
      onErrorRef.current?.(code);
    }
  }, [getEngine, options.lang, setRecordingState]);

  const start = useCallback(() => {
    // A fresh user press always restarts the silent-session budget.
    emptySessionsRef.current = 0;
    void startAsync();
  }, [startAsync]);
  // The auto-restart path uses startAsync directly (no counter reset).
  const startRef = useRef<() => void>(() => {});
  startRef.current = startAsync;

  const stop = useCallback(() => {
    manualStopRef.current = true;
    const engine = getEngine();
    engine?.stop();
    // Settle immediately; engines may or may not emit a terminal event.
    setRecordingState(false);
    onInterimRef.current?.(null);
    activeRef.current = false;
    onStopRef.current?.();
  }, [getEngine, setRecordingState]);

  const toggle = useCallback(() => {
    if (recordingRef.current || activeRef.current) stop();
    else start();
  }, [stop, start]);

  const preload = useCallback(() => {
    const engine = getEngine();
    if (!engine || !engine.supported) return;
    engine
      .load()
      .then(() => setStatus('ready'))
      .catch(() => {
        /* Surfaced on actual use via start(). */
      });
  }, [getEngine]);

  // Warm the engine in the background so the first tap is instant (configurable).
  useEffect(() => {
    if (!voiceConfig.preloadOnMount) return;
    const engine = getEngine();
    if (engine?.supported) {
      engine
        .load()
        .then(() => setStatus('ready'))
        .catch(() => {
          /* ignore: surfaced on actual use */
        });
    }
  }, [getEngine]);

  // Release the session on unmount so a dead session can't fire callbacks.
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      activeRef.current = false;
      const engine = getEngine();
      try {
        engine?.stop();
      } catch {
        /* ignore */
      }
      engineRef.current = null;
    };
  }, [getEngine]);

  return {
    supported,
    status,
    isReady: status === 'ready',
    recording,
    start,
    stop,
    toggle,
    preload,
  };
}
