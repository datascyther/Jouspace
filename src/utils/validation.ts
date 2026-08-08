export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const NAME_MIN = 1;
const NAME_MAX = 40;

/** True for control characters and other non-printable code points. */
function hasControlChars(value: string): boolean {
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

/**
 * Pure profile-name validator used by ProfileCard for inline validation.
 * Enforces: trimmed, length 1–40, no control characters.
 */
export function validateProfileName(rawName: string): ValidationResult {
  const name = rawName.trim();
  if (name.length < NAME_MIN) {
    return { valid: false, error: 'Name cannot be empty.' };
  }
  if (name.length > NAME_MAX) {
    return { valid: false, error: 'Name must be 40 characters or fewer.' };
  }
  if (hasControlChars(name)) {
    return { valid: false, error: 'Name contains invalid characters.' };
  }
  return { valid: true };
}

/**
 * Pure runtime-URL validator. Empty string is treated as "cleared" (valid,
 * allowed). Otherwise the value must parse as an http(s) URL.
 */
export function isValidRuntimeUrl(rawUrl: string): boolean {
  const url = rawUrl.trim();
  if (url === '') return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
