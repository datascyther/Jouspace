/**
 * useVoiceRecorder
 *
 * Records a short voice clip (mono 16-bit PCM WAV) for the AI chat composer.
 * Unlike the streaming speech-to-text hook (`useVoiceInput`), this captures a
 * *complete* recording and hands the caller a base64 WAV data URL — the audio
 * is uploaded to the runtime for transcription only when the user stops, so
 * nothing is streamed or sent mid-speech.
 *
 * The recording path uses the Web Audio `ScriptProcessorNode` (not
 * `MediaRecorder`) so the output is a clean, codec-free WAV that the runtime's
 * ASR gateway accepts directly — no container, no codec negotiation, no
 * platform-specific mime types. A muted gain keeps the mic graph alive without
 * looping audio back to the speakers.
 *
 * Behaviour:
 * - `start()` requests mic permission (via `usePermission`) and begins
 *   recording. A second press while recording is a no-op; call `stop()` or
 *   `cancel()` to end it.
 * - `stop()` finalizes the recording and encodes it to a WAV data URL.
 * - `cancel()` discards the in-progress clip without producing a result.
 * - `clear()` forgets a finished clip so the UI can reset.
 * - On unmount, any active session is torn down so a dead stream can't keep
 *   the mic hot or fire callbacks after the screen is gone.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePermission } from '../permissions/usePermissions';
import { getStatus } from '../permissions/PermissionService';
import type { PermissionState } from '../permissions/types';
import {
  downsample,
  encodeWav,
  arrayBufferToWavDataUrl,
} from '../utils/wav';

/** Target sample rate for the ASR models (16 kHz mono). */
const TARGET_RATE = 16000;
/** Hard ceiling: auto-stop long clips (upload size + ASR guardrail). */
const MAX_DURATION_MS = 45_000;

export interface VoiceRecording {
  /** Base64 WAV data URL (mono 16-bit PCM). */
  dataUrl: string;
  /** Clip length in ms (UI + server validation only). */
  durationMs: number;
}

export interface UseVoiceRecorderOptions {
  /** Fired once a recording has been finalized. */
  onRecording?: (recording: VoiceRecording) => void;
  /** Fired with a human-readable error when recording fails. */
  onError?: (error: string) => void;
  /** Hard ceiling in ms; the session auto-stops and finalizes past this. */
  maxDurationMs?: number;
}

export interface UseVoiceRecorderResult {
  /** True when mic + AudioContext are available in this environment. */
  supported: boolean;
  /** True while an active recording session is running. */
  recording: boolean;
  /** True while the engine is warming up (before the first sample). */
  starting: boolean;
  /** Elapsed milliseconds since recording started (0 when idle). */
  elapsedMs: number;
  /** Current human-readable error/notice, or null. */
  error: string | null;
  /** True when the only path forward is the OS settings screen. */
  canOpenSettings: boolean;
  /** The finalized recording, or null while idle/recording. */
  result: VoiceRecording | null;
  /** Begin recording (requests mic permission if needed). */
  start: () => Promise<void>;
  /** Finalize the active session. */
  stop: () => void;
  /** Release the mic stream without producing a recording. */
  cancel: () => void;
  /** Forget the finished clip. */
  clear: () => void;
  /** Open the OS settings screen (native only). */
  openSettings: () => Promise<boolean>;
}

/**
 * Voice recorder. Wraps mic permission + Web Audio capture + WAV encoding into
 * one hook so the AI composer and (later) the journal screen share a single
 * source of truth for "record a voice message".
 */
export function useVoiceRecorder(
  options: UseVoiceRecorderOptions = {},
): UseVoiceRecorderResult {
  const onRecordingRef = useRef(options.onRecording);
  onRecordingRef.current = options.onRecording;
  const onErrorRef = useRef(options.onError);
  onErrorRef.current = options.onError;

  const mic = usePermission('microphone');

  // `supported` is computed lazily so the hook is safe to call in any
  // environment (jsdom, private mode, older WebView). It only flips false
  // once the user actually taps the button — the UI hides the mic then.
  const [supported] = useState(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    return !!(w.AudioContext ?? w.webkitAudioContext);
  });

  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const [result, setResult] = useState<VoiceRecording | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const startTimeRef = useRef(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Stop tracks + disconnect graph. `stop()` does its own encoding first. */
  const teardown = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    nodeRef.current?.disconnect();
    nodeRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  // Never leak a live mic stream when the owning screen unmounts.
  useEffect(() => () => teardown(), [teardown]);

  const start = useCallback(async () => {
    if (recording || starting) return;
    setResult(null);
    setError(null);
    setCanOpenSettings(false);

    const perm = await mic.ensure();
    if (!perm.ok) {
      if (perm.state === 'deniedPermanently' || perm.state === 'restricted') {
        setError(
          'Microphone access is blocked. Enable it in your device Settings, then return here.',
        );
        setCanOpenSettings(true);
      } else if (perm.state === 'unsupported') {
        setError("Voice recording isn't available on this device.");
      } else {
        setError('Microphone permission was denied. Tap the mic to try again.');
      }
      return;
    }

    try {
      setStarting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const w = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) throw new Error('no-audio-context');

      const ctx = new Ctor();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);

      chunksRef.current = [];
      node.onaudioprocess = (e: AudioProcessingEvent) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      // Route through a muted gain so the mic never loops back to the speakers
      // (a ScriptProcessor must stay wired into the graph to fire onaudioprocess).
      const silent = ctx.createGain();
      silent.gain.value = 0;
      source.connect(node);
      node.connect(silent);
      silent.connect(ctx.destination);

      streamRef.current = stream;
      ctxRef.current = ctx;
      nodeRef.current = node;
      startTimeRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);

      // Live elapsed counter so the UI can show recording duration.
      elapsedTimerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 250);

      // Hard ceiling: auto-stop long clips (upload size + ASR guardrail).
      maxTimerRef.current = setTimeout(() => {
        if (nodeRef.current) stopRef.current();
      }, MAX_DURATION_MS);
    } catch (err: unknown) {
      teardown();
      // The blanket catch used to swallow every failure into "no microphone
      // found", even when the user had just granted permission — that masked
      // the real cause (a transient WebView inconsistency, a stale grant, or a
      // genuine NotAllowedError after a race). Re-read the live permission so
      // the UI can offer the right recovery: re-prompt, Settings, or a retry.
      const name = err instanceof Error ? err.name : '';
      const live = await getStatus('microphone').catch(() => null);
      const liveState = live?.state as PermissionState | undefined;

      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('Microphone permission was denied. Tap the mic to try again.');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setError('No microphone found for voice input.');
      } else if (liveState === 'deniedPermanently' || liveState === 'restricted') {
        setError(
          'Microphone access is blocked. Enable it in your device Settings, then return here.',
        );
        setCanOpenSettings(true);
      } else if (liveState === 'denied') {
        setError('Microphone permission was denied. Tap the mic to try again.');
      } else if (liveState === 'unsupported') {
        setError("Voice recording isn't available on this device.");
      } else {
        // Unknown / transient: surface the actual error so it isn't a black hole.
        const detail = err instanceof Error ? err.message : String(err);
        setError(detail ? `Couldn't start recording: ${detail}` : "Couldn't start recording.");
      }
    } finally {
      setStarting(false);
    }
  }, [mic, recording, starting, teardown]);

  const stop = useCallback(() => {
    if (!nodeRef.current) return; // not recording
    const durationMs = Date.now() - startTimeRef.current;
    const sampleRate = ctxRef.current?.sampleRate ?? TARGET_RATE;
    const chunks = chunksRef.current;
    teardown();
    setRecording(false);
    setElapsedMs(durationMs);

    const total = chunks.reduce((n, c) => n + c.length, 0);
    if (total === 0) {
      setError('Recording was too short to capture any audio.');
      return;
    }

    const merged = new Float32Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    const samples =
      sampleRate !== TARGET_RATE
        ? downsample(merged, sampleRate, TARGET_RATE)
        : merged;
    const wav = encodeWav(samples, TARGET_RATE);
    const rec = { dataUrl: arrayBufferToWavDataUrl(wav), durationMs };
    setResult(rec);
    onRecordingRef.current?.(rec);
  }, [teardown]);

  // Stable ref so the auto-stop timer (which closes over an older `stop`) can
  // always reach the latest implementation.
  const stopRef = useRef(stop);
  stopRef.current = stop;

  const cancel = useCallback(() => {
    if (!nodeRef.current) return;
    teardown();
    setRecording(false);
    setElapsedMs(0);
    chunksRef.current = [];
  }, [teardown]);

  const clear = useCallback(() => {
    setResult(null);
    setElapsedMs(0);
  }, []);

  const openSettings = useCallback(async (): Promise<boolean> => {
    return mic.openSettings();
  }, [mic.openSettings]);

  return {
    supported,
    recording,
    starting,
    elapsedMs,
    error,
    canOpenSettings,
    result,
    start,
    stop,
    cancel,
    clear,
    openSettings,
  };
}
