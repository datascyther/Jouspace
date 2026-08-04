/**
 * Profile Repository
 *
 * User profile CRUD. `profiles` is protected by RLS on `id = auth.uid()`, so we
 * also filter on `id` for defence-in-depth. The row is auto-created on sign-up
 * by the `handle_new_user()` trigger.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ProfilePatch = Partial<
  Pick<ProfileUpdate,
    | 'username'
    | 'display_name'
    | 'avatar_url'
    | 'bio'
    | 'timezone'
    | 'locale'
    | 'is_private'
    | 'last_login_at'
    | 'onboarding_completed'
  >
>;

export class ProfileRepository extends BaseRepository<'profiles'> {
  constructor() {
    super('profiles');
  }

  /** Fetch a profile by id (only succeeds for the caller's own profile). */
  async getById(id: string): Promise<ProfileRow | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ProfileRepository.getById');
    return data;
  }

  /** Fetch the profile of the currently authenticated user. */
  async getCurrent(): Promise<ProfileRow | null> {
    const uid = await this.getCurrentUserId();
    return this.getById(uid);
  }

  /** Update a profile by id (only succeeds for the caller's own profile). */
  async update(id: string, patch: ProfilePatch): Promise<ProfileRow> {
    await this.requireUserId();
    const { data, error } = await this.client
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ProfileRepository.update');
    if (!data) throw new Error('ProfileRepository.update: no row returned.');
    return data;
  }

  /** True when no profile currently owns this username. */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ProfileRepository.isUsernameAvailable');
    return data === null;
  }

  /** Convenience helper: set the avatar (storage path or URL) for the user. */
  async updateAvatar(path: string): Promise<ProfileRow> {
    const uid = await this.requireUserId();
    return this.update(uid, { avatar_url: path });
  }
}

export const profileRepository = new ProfileRepository();
export default profileRepository;
