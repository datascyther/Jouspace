import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecorder } from './useVoiceRecorder';

type ProcessorEvent = {
  inputBuffer: { getChannelData: (ch: number) => Float32Array };
};
type ProcessorHandler = (e: ProcessorEvent) => void;

/** Controllable fake of PermissionService + Web Audio, shared across tests. */
const holder = vi.hoisted(() => ({
  permission: {
    key: 'microphone' as const,
    state: 'granted' as string,
    ok: true as boolean,
    reason: undefined as string | undefined,
  },
  processor: null as {
    onaudioprocess: ProcessorHandler | null;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  } | null,
}));

vi.mock('../permissions/PermissionService', () => ({
  getStatus: vi.fn(async () => ({ key: 'microphone', state: 'granted' })),
  ensure: vi.fn(async () => holder.permission),
  openSettings: vi.fn(async () => true),
}));

const getUserMedia = vi.fn();

function stubMediaDevices(): void {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
}

/** Install a minimal AudioContext graph so the recorder can capture + encode. */
function stubWebAudio(): void {
  const processor = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null as ProcessorHandler | null,
  };
  const gain = { gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
  const destination = { connect: vi.fn(), disconnect: vi.fn() };

  class FakeAudioContext {
    sampleRate = 16000;
    destination = destination;
    createMediaStreamSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }));
    createScriptProcessor = vi.fn(() => processor);
    createGain = vi.fn(() => gain);
    close = vi.fn(async () => {});
  }

  holder.processor = processor;
  vi.stubGlobal('AudioContext', FakeAudioContext);
}

async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function fakeStream() {
  return { getTracks: () => [{ stop: vi.fn() }] };
}

describe('useVoiceRecorder', () => {
  beforeEach(() => {
    holder.permission = {
      key: 'microphone',
      state: 'granted',
      ok: true,
      reason: undefined,
    };
    holder.processor = null;
    getUserMedia.mockReset();
    stubMediaDevices();
    vi.unstubAllGlobals();
    stubWebAudio();
  });

  it('reports unsupported when getUserMedia or AudioContext are absent', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });
    vi.unstubAllGlobals();

    const { result } = renderHook(() => useVoiceRecorder());
    await flush();
    expect(result.current.supported).toBe(false);
  });

  it('reports supported when getUserMedia + AudioContext exist', async () => {
    const { result } = renderHook(() => useVoiceRecorder());
    await flush();
    expect(result.current.supported).toBe(true);
  });

  it('records mic samples into a WAV data URL on stop', async () => {
    getUserMedia.mockResolvedValue(fakeStream());
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(result.current.recording).toBe(true);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });

    // Feed two sample buffers through the processor.
    holder.processor?.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array([0.5, -0.5]) },
    });
    holder.processor?.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array([1, -1]) },
    });

    act(() => result.current.stop());
    await flush();

    expect(result.current.recording).toBe(false);
    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.dataUrl.startsWith('data:audio/wav;base64,')).toBe(true);
    expect(result.current.result!.durationMs).toBeGreaterThan(0);
  });

  it('does not record when permission is denied', async () => {
    holder.permission = { key: 'microphone', state: 'denied', ok: false, reason: 'denied' };
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.recording).toBe(false);
    expect(result.current.error).toContain('denied');
  });

  it('flags Settings (without opening it) when permanently denied', async () => {
    holder.permission = {
      key: 'microphone',
      state: 'deniedPermanently',
      ok: false,
      reason: 'blocked',
    };
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(result.current.canOpenSettings).toBe(true);
    expect(result.current.error).toContain('blocked');
  });

  // Regression: the old blanket catch swallowed every getUserMedia failure
  // into "no microphone found", even after a successful grant — masking the
  // real cause. Each failure class must now surface its own message.
  it('reports "no microphone found" only for a genuine NotFoundError', async () => {
    getUserMedia.mockRejectedValue(
      Object.assign(new Error('absent'), { name: 'NotFoundError' }),
    );
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(result.current.recording).toBe(false);
    expect(result.current.error).toContain('No microphone found');
    expect(result.current.error).not.toContain('denied');
  });

  it('reports a denied message when getUserMedia throws NotAllowedError', async () => {
    getUserMedia.mockRejectedValue(
      Object.assign(new Error('blocked'), { name: 'NotAllowedError' }),
    );
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(result.current.error).toContain('denied');
    expect(result.current.error).not.toContain('No microphone found');
  });

  it('surfaces the underlying error instead of hiding it behind "no microphone found"', async () => {
    getUserMedia.mockRejectedValue(new Error('boom: transient WebView glitch'));
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(result.current.error).toContain('boom: transient WebView glitch');
    expect(result.current.error).not.toContain('no microphone found');
  });

  it('errors on a recording with no captured samples', async () => {
    getUserMedia.mockResolvedValue(fakeStream());
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();
    act(() => result.current.stop());
    await flush();

    expect(result.current.result).toBeNull();
    expect(result.current.error).toContain('too short');
  });

  it('stops the mic tracks on unmount while recording', async () => {
    const stop = vi.fn();
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop }] });
    const { result, unmount } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();
    expect(result.current.recording).toBe(true);

    unmount();
    expect(stop).toHaveBeenCalled();
  });

  it('ignores a second start while already recording', async () => {
    getUserMedia.mockResolvedValue(fakeStream());
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();
    expect(result.current.recording).toBe(true);

    await act(async () => {
      await result.current.start();
    });
    await flush();

    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('discards the in-progress clip on cancel', async () => {
    getUserMedia.mockResolvedValue(fakeStream());
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();
    expect(result.current.recording).toBe(true);

    act(() => result.current.cancel());
    await flush();

    expect(result.current.recording).toBe(false);
    expect(result.current.result).toBeNull();

    // A late stop is a no-op: nothing was captured, nothing to encode.
    act(() => result.current.stop());
    await flush();
    expect(result.current.result).toBeNull();
  });

  it('forgets the finished clip on clear', async () => {
    getUserMedia.mockResolvedValue(fakeStream());
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.start();
    });
    await flush();
    holder.processor?.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array([0.5]) },
    });

    act(() => result.current.stop());
    await flush();
    expect(result.current.result).not.toBeNull();

    act(() => result.current.clear());
    expect(result.current.result).toBeNull();
  });
});
