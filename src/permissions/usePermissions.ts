import { useCallback, useEffect, useState } from 'react';
import type { PermissionKey, PermissionResult, PermissionState } from './types';
import { PERMISSIONS, PERMISSION_ORDER } from './registry';
import * as svc from './PermissionService';

/**
 * Subscribe to a single permission's status and get `ensure` / `openSettings`
 * helpers bound to it. Status is refreshed on mount.
 */
export function usePermission(key: PermissionKey) {
  const [state, setState] = useState<PermissionState>('unknown');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void svc.getStatus(key).then((s) => {
      if (active) setState(s.state);
    });
    return () => {
      active = false;
    };
  }, [key]);


  const ensure = useCallback(async (): Promise<PermissionResult> => {
    setBusy(true);
    try {
      const res = await svc.ensure(key);
      setState(res.state);
      return res;
    } finally {
      setBusy(false);
    }
  }, [key]);

  const openSettings = useCallback(async (): Promise<boolean> => {
    const ok = await svc.openSettings(key);
    if (ok) window.setTimeout(() => void svc.getStatus(key).then((s) => setState(s.state)), 700);
    return ok;
  }, [key]);

  return { meta: PERMISSIONS[key], state, busy, ensure, openSettings };
}

/** Bulk variant for screens that show every permission at once (e.g. primer). */
export function usePermissions() {
  const [states, setStates] = useState<Record<PermissionKey, PermissionState>>({
    microphone: 'unknown',
    notifications: 'unknown',
  });

  useEffect(() => {
    let active = true;
    void Promise.all(PERMISSION_ORDER.map((k) => svc.getStatus(k))).then((results) => {
      if (!active) return;
      setStates((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.key] = r.state;
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const ensure = useCallback(async (key: PermissionKey): Promise<PermissionResult> => {
    const res = await svc.ensure(key);
    setStates((m) => ({ ...m, [key]: res.state }));
    return res;
  }, []);

  const openSettings = useCallback(async (key: PermissionKey): Promise<boolean> => {
    const ok = await svc.openSettings(key);
    if (ok) {
      window.setTimeout(
        () => void svc.getStatus(key).then((s) => setStates((m) => ({ ...m, [s.key]: s.state }))),
        700,
      );
    }
    return ok;
  }, []);

  // Re-read a single permission's live status from the OS and update state.
  const refresh = useCallback(async (key: PermissionKey): Promise<PermissionState> => {
    const s = await svc.getStatus(key);
    setStates((m) => ({ ...m, [s.key]: s.state }));
    return s.state;
  }, []);

  return { states, ensure, openSettings, refresh };
}
