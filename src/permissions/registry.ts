import type { PermissionKey, PermissionMeta } from './types';

/**
 * Declarative catalogue of every permission Jouspace might request.
 *
 * This is the single source of truth — used by the primer screen, settings,
 * and (eventually) the App Store / Play Store privacy questionnaire. Keep it
 * honest: only list what the app actually uses, with a real benefit.
 */
export const PERMISSIONS: Record<PermissionKey, PermissionMeta> = {
  microphone: {
    key: 'microphone',
    title: 'Microphone',
    benefit: 'Speak your entries out loud — voice journaling with live transcription.',
    rationale:
      'Jouspace uses your microphone only to transcribe your voice into text. ' +
      'On Android the transcription is performed by the device’s own speech-' +
      'recognition service (typically Google’s), so the audio is sent to that ' +
      'service to be turned into text for your entry — it is used for nothing else.',
    required: false,
    // Voice typing is deprecated for this release; the mic permission plumbing
    // stays wired (native + web bridges, PermissionService) so the feature can
    // be revived later. It is simply never surfaced in the primer / settings UI.
    usedBy: [],
  },
  notifications: {
    key: 'notifications',
    title: 'Notifications',
    benefit: 'Gentle reflection reminders so journaling becomes a habit.',
    rationale:
      'Jouspace sends a few quiet reminders to write. No marketing, no noise — ' +
      'you can turn them off anytime in Settings.',
    required: false,
    usedBy: ['Reflection reminders', 'Settings → Notifications'],
  },
};

/** Stable display order for the primer / settings list. Only notifications are
 *  offered to users this release — the microphone permission exists in the
 *  catalogue but is deliberately not presented. */
export const PERMISSION_ORDER: PermissionKey[] = ['notifications'];
