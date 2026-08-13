import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as svc from './PermissionService';

/**
 * jsdom has no real permission APIs, so we install minimal mocks for
 * navigator.mediaDevices.getUserMedia, navigator.permissions, and Notification.
 * The native path is exercised separately by mocking window.Capacitor.
 */
function installWebMocks(overrides: {
  getUserMedia?: (() => Promise<MediaStream>) | null;
  permissionState?: string;
  notificationPermission?: string;
}) {
  const nav = navigator as any;
  if ('mediaDevices' in nav) {
    nav.mediaDevices.getUserMedia = overrides.getUserMedia ?? (async () => ({ getTracks: () => [] }) as any);
  } else {
    nav.mediaDevices = { getUserMedia: overrides.getUserMedia ?? (async () => ({ getTracks: () => [] }) as any) };
  }
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
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('PermissionService (web)', () => {
  it('grants the microphone when getUserMedia resolves', async () => {
    installWebMocks({ getUserMedia: async () => ({ getTracks: () => [] }) as any });
    const res = await svc.ensure('microphone');
    expect(res.ok).toBe(true);
    expect(res.state).toBe('granted');
  });

  it('reports denied when getUserMedia rejects with NotAllowedError', async () => {
    installWebMocks({
      getUserMedia: async () => {
        throw Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
      },
    });
    const res = await svc.ensure('microphone');
    expect(res.ok).toBe(false);
    expect(res.state).toBe('deniedPermanently'); // attempted once → permanent
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

describe('PermissionService (native)', () => {
  it('uses Capacitor plugins when window.Capacitor is present', async () => {
    const requestPermissions = vi.fn(async () => ({ permission: 'granted' }));
    const checkPermissions = vi.fn(async () => ({ permission: 'prompt' }));
    const openSettings = vi.fn(async () => {});
    (window as any).Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        Microphone: { requestPermissions, checkPermissions },
        App: { openSettings },
      },
    };

    const res = await svc.ensure('microphone');
    expect(checkPermissions).toHaveBeenCalled();
    expect(requestPermissions).toHaveBeenCalled();
    expect(res.ok).toBe(true);

    const opened = await svc.openSettings('microphone');
    expect(opened).toBe(true);
    expect(openSettings).toHaveBeenCalled();
  });

  it('maps a native denial to deniedPermanently after a request', async () => {
    (window as any).Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        Microphone: { requestPermissions: async () => ({ permission: 'denied' }) },
      },
    };
    const res = await svc.request('microphone');
    expect(res.ok).toBe(false);
    expect(res.state).toBe('deniedPermanently');
  });
});
