/**
 * useCheckInPresence — shared reactive check-in presence.
 *
 * Reads/writes the latest mood check-in from the global Zustand store so any
 * screen (Home, Journey, Chat) can reflect the user's most recent check-in
 * without server round-trips. This is client-side reactive presence only.
 */

import { useAppStore } from '@/core/store/useAppStore';
import type { LastCheckIn } from '@/core/store/useAppStore';

export function useCheckInPresence(): {
  lastCheckIn: LastCheckIn | null;
  setLastCheckIn: (payload: LastCheckIn) => void;
  clearLastCheckIn: () => void;
} {
  const lastCheckIn = useAppStore((s) => s.lastCheckIn);
  const setLastCheckIn = useAppStore((s) => s.setLastCheckIn);
  const clearLastCheckIn = useAppStore((s) => s.clearLastCheckIn);

  return { lastCheckIn, setLastCheckIn, clearLastCheckIn };
}

export default useCheckInPresence;
