import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * jsdom has no real Capacitor runtime, so the native mic path is exercised by
 * mocking nativeBridge's mic functions directly (the MicPermission plugin
 * requests RECORD_AUDIO through the real Android API). Notifications and
 * openSettings still go through the real nativeBridge, which reads
 * window.Capacitor.Plugins — so we keep that global populated.
 *
 * vi.mock factories are hoisted, so only the FIRST one applied wins; share a
 * mutable state object so every test can reconfigure the plugin's behavior,
 * and use a dynamic import so PermissionService picks up the mock.
 */
const state = { check: null as string | null, request: 'denied', requestNull: false };

vi.mock('./nativeBridge', () => ({
  isNativePlatform: () => true,
  nativeCheckMicrophone: vi.fn(async () => state.check),
  nativeRequestMicrophone: vi.fn(async () => (state.requestNull ? null : state.request)),
  nativeCheckNotifications: vi.fn(async () => 'granted'),
  nativeRequestNotifications: vi.fn(async () => 'granted'),
  nativeOpenSettings: vi.fn(async () => true),
}));

beforeEach(() => {
  (window as any).Capacitor = {
    isNativePlatform: () => true,
    Plugins: { App: { openSettings: vi.fn(async () => {}) } },
  };
  localStorage.clear();
  state.check = 'denied';
  state.request = 'denied';
  state.requestNull = false;
});

describe('PermissionService (native)', () => {
  it('reads the microphone permission through the MicPermission plugin', async () => {
    state.check = 'granted';
    state.request = 'granted';
    const mod = await import('./PermissionService');
    const res = await mod.ensure('microphone');
    expect(res.ok).toBe(true);
    expect(res.state).toBe('granted');
  });

  it('maps a first native denial to denied (re-promptable)', async () => {
    const mod = await import('./PermissionService');
    const res = await mod.request('microphone');
    expect(res.ok).toBe(false);
    expect(res.state).toBe('denied');
  });

  it('maps a second native denial to deniedPermanently', async () => {
    const mod = await import('./PermissionService');
    await mod.request('microphone'); // persists attempted = true
    const res = await mod.request('microphone');
    expect(res.ok).toBe(false);
    expect(res.state).toBe('deniedPermanently');
  });

  it('treats an unavailable plugin as unsupported (never "blocked")', async () => {
    state.check = null;
    state.requestNull = true;
    const mod = await import('./PermissionService');
    const res = await mod.ensure('microphone');
    expect(res.ok).toBe(false);
    expect(res.state).toBe('unsupported');
    expect(res.reason && res.reason.length > 0).toBe(true);
  });

  it('can open OS settings on native', async () => {
    state.check = 'granted';
    state.request = 'granted';
    const mod = await import('./PermissionService');
    const opened = await mod.openSettings('microphone');
    expect(opened).toBe(true);
  });
});