/**
 * ProfileService — application boundary for `profiles`.
 *
 * Thin facade over ProfileRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → ProfileService → ProfileRepository → Supabase
 */

import { profileRepository } from '../repositories/ProfileRepository';
import type { ProfilePatch } from '../repositories/ProfileRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

class ProfileService {
  getById(id: string): Promise<ProfileRow | null> {
    return profileRepository.getById(id);
  }

  getCurrent(): Promise<ProfileRow | null> {
    return profileRepository.getCurrent();
  }

  update(id: string, patch: ProfilePatch): Promise<ProfileRow> {
    return profileRepository.update(id, patch);
  }

  /** True when no profile currently owns this username. */
  isUsernameAvailable(username: string): Promise<boolean> {
    if (!username || username.trim().length === 0) {
      throw new RepositoryError('ProfileService.isUsernameAvailable: username is required.', {
        code: 'VALIDATION',
      });
    }
    return profileRepository.isUsernameAvailable(username);
  }

  /** Convenience helper: set the avatar (storage path or URL) for the user. */
  updateAvatar(path: string): Promise<ProfileRow> {
    return profileRepository.updateAvatar(path);
  }
}

export type { ProfileRow };
export const profileService = new ProfileService();
export { RepositoryError };
export default profileService;
