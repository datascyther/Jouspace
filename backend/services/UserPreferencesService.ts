/**
 * UserPreferencesService — application boundary for `user_preferences`.
 *
 * Thin facade over UserPreferencesRepository. The ViewModel/UI must talk to this
 * service (never to the repository or Supabase directly), matching how
 * `AuthService` already works:
 *
 *    UI / ViewModel → UserPreferencesService → UserPreferencesRepository → Supabase
 */

import { userPreferencesRepository } from '../repositories/UserPreferencesRepository';
import type {
  PreferencesInput,
  PreferencesPatch,
} from '../repositories/UserPreferencesRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type PreferencesRow = Database['public']['Tables']['user_preferences']['Row'];

class UserPreferencesService {
  get(): Promise<PreferencesRow | null> {
    return userPreferencesRepository.get();
  }

  /** Insert preferences, or update the existing row (unique `user_id`). */
  upsert(input: PreferencesInput): Promise<PreferencesRow> {
    return userPreferencesRepository.upsert(input);
  }

  update(patch: PreferencesPatch): Promise<PreferencesRow> {
    return userPreferencesRepository.update(patch);
  }
}

export type { PreferencesRow };
export const userPreferencesService = new UserPreferencesService();
export { RepositoryError };
export default userPreferencesService;
