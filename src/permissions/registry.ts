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
      'Audio stays on your device (or your chosen private runtime) and is never ' +
      'used for anything else.',
    required: false,
    usedBy: ['AI composer mic', 'Journal writing-toolbar mic'],
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

/** Stable display order for the primer / settings list. */
export const PERMISSION_ORDER: PermissionKey[] = ['microphone', 'notifications'];
