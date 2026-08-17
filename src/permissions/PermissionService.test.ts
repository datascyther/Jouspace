import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as svc from './PermissionService';

/**
 * jsdom has no real permission APIs, so we install minimal mocks for
 * navigator.mediaDevices.getUserMedia, navigator.permissions, and Notification.
 * The mic permission is driven through the web APIs on every platform in
 * tests; the native path (MicPermission plugin → RECORD_AUDIO) is covered in
 * PermissionService.native.test.ts.
 */

function resetWebMocks() {
  const nav = navigator as any;
  try {
    nav.mediaDevices = undefined;
  } catch {
    /* ignore */
  }
  try {
    nav.permissions = undefined;
  } catch {
    /* ignore */
  }
}

function installWebMocks(overrides: {
  getUserMedia?: (() => Promise<MediaStream>) | null;
  permissionState?: string;
  notificationPermission?: string;
}) {
  const nav = navigator as any;
  nav.mediaDevices = {
    getUserMedia:
      overrides.getUserMedia ?? (async () => ({ getTracks: () => [] }) as any),
  };
  nav.permissions = {
    query: async () => ({ state: overrides.permissionState ?? 'prompt' }),
  };
  (window as any).Notification = class {
    static permission = overrides.notificationPermission ?? 'default';
    static async requestPermission() {
      return 'granted';
    }
  };
}

beforeEach(() => {
  localStorage.clear();
  delete (window as any).Capacitor;
  resetWebMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
  resetWebMocks();
});

describe('PermissionService (web)', () => {
  beforeEach(() => {
    vi.unmock('./nativeBridge');
  });
  it('grants the microphone when getUserMedia resolves', async () => {
    installWebMocks({ getUserMedia: async () => ({ getTracks: () => [] }) as any });
    const res = await svc.ensure('microphone');
    expect(res.ok).toBe(true);
    expect(res.state).toBe('granted');
  });

  it('reports denied (re-promptable) on the first NotAllowedError', async () => {
    installWebMocks({
      getUserMedia: async () => {
        throw Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
      },
    });
    const res = await svc.ensure('microphone');
    expect(res.ok).toBe(false);
    expect(res.state).toBe('denied');
  });

  it('treats an earlier denial as permanently denied without re-prompting', async () => {
    installWebMocks({
      getUserMedia: async () => {
        throw Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
      },
    });
    await svc.request('microphone');
    const second = await svc.ensure('microphone');
    expect(second.ok).toBe(false);
    expect(second.state).toBe('deniedPermanently');
  });

  it('grants notifications on the web', async () => {
    installWebMocks({ notificationPermission: 'default' });
    const res = await svc.ensure('notifications');
    expect(res.ok).toBe(true);
    expect(res.state).toBe('granted');
  });

  it('does not open OS settings on the web (returns false)', async () => {
    installWebMocks({});
    expect(await svc.openSettings('microphone')).toBe(false);
  });
});