/**
 * Environment validation.
 *
 * Phase 2 security cleanup:
 * - Frontend must not reference NVIDIA credentials.
 * - Server-side env validation remains in backend routes.
 */
export function checkEnvVariables(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  return { isValid: true, errors: [], warnings: [] };
}
