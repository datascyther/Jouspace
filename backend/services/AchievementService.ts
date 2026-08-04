/**
 * AchievementService — application boundary for `achievements`.
 *
 * Thin facade over AchievementRepository. The ViewModel/UI must talk to this
 * service (never to the repository or Supabase directly), matching how
 * `AuthService` already works:
 *
 *    UI / ViewModel → AchievementService → AchievementRepository → Supabase
 */

import { achievementRepository } from '../repositories/AchievementRepository';
import type {
  AchievementInput,
  AchievementPatch,
} from '../repositories/AchievementRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type AchievementRow = Database['public']['Tables']['achievements']['Row'];
type AchievementType = Database['public']['Enums']['achievement_type'];

class AchievementService {
  list(): Promise<AchievementRow[]> {
    return achievementRepository.list();
  }

  listByType(type: AchievementType): Promise<AchievementRow[]> {
    return achievementRepository.listByType(type);
  }

  get(id: string): Promise<AchievementRow | null> {
    return achievementRepository.get(id);
  }

  create(input: AchievementInput): Promise<AchievementRow> {
    return achievementRepository.create(input);
  }

  update(id: string, patch: AchievementPatch): Promise<AchievementRow> {
    return achievementRepository.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return achievementRepository.remove(id);
  }
}

export type { AchievementRow };
export const achievementService = new AchievementService();
export { RepositoryError };
export default achievementService;
