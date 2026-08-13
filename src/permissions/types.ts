/**
 * Unified permission model for Jouspace.
 *
 * The app may run as a plain web app or inside a Capacitor native shell. Both
 * paths are normalized into this single state machine so the UI never has to
 * care which platform it is on.
 */

/** Every permission the app is aware of. Add new ones here + in `registry.ts`. */
export type PermissionKey = 'microphone' | 'notifications';

/**
 * Normalized cross-platform status.
 * - `granted`           – usable right now.
 * - `prompt`            – never asked; a prompt can/should appear.
 * - `denied`            – refused, but may be re-promptable (rare on mobile).
 * - `deniedPermanently` – OS will not show another prompt; must go to Settings.
 * - `restricted`        – blocked by parental controls / MDM (iOS).
 * - `unsupported`       – device/context can't provide it.
 * - `unknown`           – couldn't be determined (treat as "ask when needed").
 */
export type PermissionState =
  | 'granted'
  | 'denied'
  | 'deniedPermanently'
  | 'restricted'
  | 'unsupported'
  | 'prompt'
  | 'unknown';

export interface PermissionMeta {
  key: PermissionKey;
  /** Short title for lists / settings. */
  title: string;
  /** One-line benefit shown in the primer. */
  benefit: string;
  /** Longer copy used for an in-app rationale before a native prompt. */
  rationale: string;
  /** Whether the app is unusable without it (none currently). */
  required: boolean;
  /** Where in the app this permission is first needed (for store review notes). */
  usedBy: string[];
}

export interface PermissionStatus {
  key: PermissionKey;
  state: PermissionState;
}

export interface PermissionResult {
  key: PermissionKey;
  state: PermissionState;
  /** True when the feature may proceed (i.e. not blocked). */
  ok: boolean;
  /** Human-readable reason when not ok (for UI). */
  reason?: string;
}
