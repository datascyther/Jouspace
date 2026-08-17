import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceInput } from './useVoiceInput';
import type { SttEngine, SttEngineCallbacks } from '../voice/types';

/**
 * A controllable fake STT engine implementing the `SttEngine` interface. We drive
 * it from the test via `emitResult/emitInterim/emitError/emitEnd` to verify the
 * hook's contract (dedupe, interim, fatal vs benign, resume) without any real
 * speech runtime. Because the hook talks only to the engine interface, this also
 * exercises the on-device Whisper path's logic, not just Web Speech.
 */
class FakeEngine implements SttEngine {
  id = 'web-speech' as const;
  supported = true;
  startCallCount = 0;
  stopped = false;
  private callbacks: SttEngineCallbacks = {};

  setCallbacks(cb: SttEngineCallbacks): void {
    this.callbacks = cb;
  }
  async load(): Promise<void> {
    /* nothing to load in the fake */
  }
  async start(): Promise<void> {
    this.startCallCount++;
    this.stopped = false;
    this.callbacks.onStart?.();
  }
  stop(): void {
    // Mirrors the real engines: `stop()` does NOT fire onStop itself; the hook
    // owns onStop (driven by the terminal 'end' or a direct stop()).
    this.stopped = true;
  }
  emitResult(text: string, index: number): void {
    this.callbacks.onResult?.(text, true, index);
  }
  emitInterim(text: string | null): void {
    this.callbacks.onInterim?.(text);
  }
  emitError(code: string): void {
    this.callbacks.onError?.(code);
  }
  emitEnd(): void {
    this.callbacks.onEnd?.();
  }
}

/** Flush all queued microtasks/macrotasks so async engine callbacks settle. */
async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function renderWithEngine(engine: FakeEngine, options = {}) {
  const factory = () => engine;
  return renderHook(() => useVoiceInput(options, factory));
}

describe('useVoiceInput (engine-driven)', () => {
  it('reports unsupported when the engine is unavailable', async () => {
    const engine = new FakeEngine();
    engine.supported = false;
    const onError = vi.fn();
    const { result } = renderWithEngine(engine, { onError });

    expect(result.current.supported).toBe(false);
    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(result.current.recording).toBe(false);
    expect(onError).toHaveBeenCalledWith('not-supported');
  });

  it('starts a session and toggles recording', async () => {
    const engine = new FakeEngine();
    const onStart = vi.fn();
    const onStop = vi.fn();
    const { result } = renderWithEngine(engine, { onStart, onStop });

    expect(result.current.supported).toBe(true);

    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(result.current.recording).toBe(true);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(engine.startCallCount).toBe(1);

    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(result.current.recording).toBe(false);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('commits only finalized segments — never duplicates by index', async () => {
    const engine = new FakeEngine();
    const onFinal = vi.fn();
    const { result } = renderWithEngine(engine, { onFinal });

    await act(async () => {
      result.current.toggle();
    });
    await flush();

    engine.emitResult('hello', 0);
    engine.emitResult('world', 1);
    expect(onFinal).toHaveBeenCalledTimes(2);
    expect(onFinal).toHaveBeenNthCalledWith(1, 'hello');
    expect(onFinal).toHaveBeenNthCalledWith(2, 'world');

    // Re-delivering the same indices must NOT duplicate.
    engine.emitResult('hello', 0);
    engine.emitResult('world', 1);
    expect(onFinal).toHaveBeenCalledTimes(2);

    // A later, separate final segment at a higher index is committed once.
    engine.emitResult('again', 2);
    expect(onFinal).toHaveBeenCalledTimes(3);
    expect(onFinal).toHaveBeenNthCalledWith(3, 'again');
  });

  it('surfaces the error code and stops cleanly on a fatal error', async () => {
    const engine = new FakeEngine();
    const onStop = vi.fn();
    const onError = vi.fn();
    const { result } = renderWithEngine(engine, { onStop, onError });

    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(result.current.recording).toBe(true);

    engine.emitError('network');
    engine.emitEnd();
    await flush();

    expect(onError).toHaveBeenCalledWith('network');
    expect(result.current.recording).toBe(false);
    expect(onStop).toHaveBeenCalledTimes(1);
    // Fatal error → no resume (start still called only once).
    expect(engine.startCallCount).toBe(1);
  });

  it('streams interim text and clears it when finalized/stopped', async () => {
    const engine = new FakeEngine();
    const onFinal = vi.fn();
    const onInterim = vi.fn();
    const { result } = renderWithEngine(engine, { onFinal, onInterim });

    await act(async () => {
      result.current.toggle();
    });
    await flush();

    engine.emitInterim('hello');
    expect(onInterim).toHaveBeenLastCalledWith('hello');
    expect(onFinal).not.toHaveBeenCalled();

    engine.emitResult('hello', 0);
    engine.emitInterim('world');
    expect(onFinal).toHaveBeenLastCalledWith('hello');
    expect(onInterim).toHaveBeenLastCalledWith('world');

    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(onInterim).toHaveBeenLastCalledWith(null);
  });

  it('resumes automatically on a benign end (continuous listening)', async () => {
    const engine = new FakeEngine();
    const { result } = renderWithEngine(engine);

    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(engine.startCallCount).toBe(1);

    // Benign silence end (no error, no manual stop) → resume.
    engine.emitEnd();
    await flush();

    expect(engine.startCallCount).toBe(2);
    expect(result.current.recording).toBe(true);
  });

  it('preload warms the engine without starting a session', async () => {
    const engine = new FakeEngine();
    const loadSpy = vi.spyOn(engine, 'load');
    const { result } = renderWithEngine(engine);

    result.current.preload();
    await flush();

    expect(loadSpy).toHaveBeenCalled();
    expect(engine.startCallCount).toBe(0);
    expect(result.current.recording).toBe(false);
  });

  it('gives up after 3 consecutive silent sessions (idle-timeout)', async () => {
    const engine = new FakeEngine();
    const onError = vi.fn();
    const { result } = renderWithEngine(engine, { onError });

    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(engine.startCallCount).toBe(1);

    engine.emitEnd();
    await flush();
    expect(engine.startCallCount).toBe(2);
    engine.emitEnd();
    await flush();
    expect(engine.startCallCount).toBe(3);
    engine.emitEnd();
    await flush();

    // No 4th restart — listening settles to idle.
    expect(engine.startCallCount).toBe(3);
    expect(onError).toHaveBeenCalledWith('idle-timeout');
    expect(result.current.recording).toBe(false);
  });

  it('resets the silent-session counter when a result arrives', async () => {
    const engine = new FakeEngine();
    const { result } = renderWithEngine(engine);

    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(engine.startCallCount).toBe(1);

    engine.emitEnd();
    await flush();
    expect(engine.startCallCount).toBe(2);

    // A session that produces a result clears the silent counter.
    engine.emitResult('hello', 0);
    engine.emitEnd();
    await flush();
    expect(engine.startCallCount).toBe(3);

    // So the next silent session is only the first again, not a "third".
    engine.emitEnd();
    await flush();
    expect(engine.startCallCount).toBe(4);
  });

  it('does not resume after a manual stop', async () => {
    const engine = new FakeEngine();
    const { result } = renderWithEngine(engine);

    await act(async () => {
      result.current.toggle();
    });
    await flush();
    expect(engine.startCallCount).toBe(1);

    await act(async () => {
      result.current.stop();
    });
    await flush();
    expect(engine.startCallCount).toBe(1);

    // A late benign end from the engine must NOT restart a manual stop.
    engine.emitEnd();
    await flush();
    expect(engine.startCallCount).toBe(1);
    expect(result.current.recording).toBe(false);
  });
});
