import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceDictation } from './useVoiceDictation';
import { resetSttEngineForTests } from '../voice/createSttEngine';
import type { SttEngine, SttEngineCallbacks } from '../voice/types';

/** Controllable fake of PermissionService's `ensure`/`openSettings`. */
const svc = vi.hoisted(() => ({
  result: {
    key: 'microphone' as const,
    state: 'granted' as string,
    ok: true as boolean,
    reason: undefined as string | undefined,
  },
  openSettingsOk: true,
  openSettingsCalled: false,
}));

vi.mock('../permissions/PermissionService', () => ({
  getStatus: vi.fn(async () => ({ key: 'microphone', state: 'prompt' })),
  ensure: vi.fn(async () => svc.result),
  openSettings: vi.fn(async () => {
    svc.openSettingsCalled = true;
    return svc.openSettingsOk;
  }),
}));

/** Controllable fake STT engine. */
class FakeEngine implements SttEngine {
  id = 'web-speech' as const;
  supported = true;
  startCallCount = 0;
  stopped = false;
  private cb: SttEngineCallbacks = {};
  setCallbacks(cb: SttEngineCallbacks): void {
    this.cb = cb;
  }
  async load(): Promise<void> {}
  async start(): Promise<void> {
    this.startCallCount++;
    this.stopped = false;
    this.cb.onStart?.();
  }
  stop(): void {
    this.stopped = true;
  }
  emitResult(text: string, index: number): void {
    this.cb.onResult?.(text, true, index);
  }
}

async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function setResult(state: string, ok: boolean, reason?: string): void {
  svc.result = { key: 'microphone', state, ok, reason };
}

describe('useVoiceDictation', () => {
  beforeEach(() => {
    setResult('granted', true);
    svc.openSettingsOk = true;
    svc.openSettingsCalled = false;
    resetSttEngineForTests(() => new FakeEngine());
  });

  it('starts the engine when permission is granted', async () => {
    const engine = new FakeEngine();
    resetSttEngineForTests(() => engine);
    const onText = vi.fn();
    const { result } = renderHook(() => useVoiceDictation({ onText }));

    await act(async () => {
      await result.current.onMicPress();
    });
    await flush();

    expect(engine.startCallCount).toBe(1);
  });

  it('does not start and avoids the old "blocked" copy when denied', async () => {
    const engine = new FakeEngine();
    resetSttEngineForTests(() => engine);
    setResult('denied', false);
    const { result } = renderHook(() => useVoiceDictation({ onText: vi.fn() }));

    await act(async () => {
      await result.current.onMicPress();
    });
    await flush();

    expect(engine.startCallCount).toBe(0);
    expect(result.current.error).toContain('denied');
    expect(result.current.error).not.toContain('blocked');
    expect(result.current.canOpenSettings).toBe(false);
  });

  it('flags Settings (without auto-opening) when permanently denied', async () => {
    const engine = new FakeEngine();
    resetSttEngineForTests(() => engine);
    setResult('deniedPermanently', false);
    const { result } = renderHook(() => useVoiceDictation({ onText: vi.fn() }));

    await act(async () => {
      await result.current.onMicPress();
    });
    await flush();

    expect(engine.startCallCount).toBe(0);
    expect(result.current.canOpenSettings).toBe(true);
    expect(result.current.error).toContain('blocked');
    expect(svc.openSettingsCalled).toBe(false);
  });

  it('treats a second press as a stop (no double session)', async () => {
    const engine = new FakeEngine();
    resetSttEngineForTests(() => engine);
    const { result } = renderHook(() => useVoiceDictation({ onText: vi.fn() }));

    await act(async () => {
      await result.current.onMicPress();
    });
    await flush();
    await act(async () => {
      await result.current.onMicPress();
    });
    await flush();

    expect(engine.startCallCount).toBe(1);
  });

  it('stops the engine on unmount while recording', async () => {
    const engine = new FakeEngine();
    resetSttEngineForTests(() => engine);
    const { result, unmount } = renderHook(() => useVoiceDictation({ onText: vi.fn() }));

    await act(async () => {
      await result.current.onMicPress();
    });
    await flush();
    expect(engine.startCallCount).toBe(1);

    unmount();
    expect(engine.stopped).toBe(true);
  });

  it('passes finalized text to onText', async () => {
    const engine = new FakeEngine();
    resetSttEngineForTests(() => engine);
    const onText = vi.fn();
    const { result } = renderHook(() => useVoiceDictation({ onText }));

    await act(async () => {
      await result.current.onMicPress();
    });
    await flush();
    engine.emitResult('hello', 0);
    expect(onText).toHaveBeenCalledWith('hello');
  });
});
