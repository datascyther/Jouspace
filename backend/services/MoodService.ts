/**
 * MoodService — application boundary for `moods`.
 *
 * Thin facade over MoodRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → MoodService → MoodRepository → Supabase
 */

import { moodRepository } from '../repositories/MoodRepository';
import type { MoodInput, MoodPatch } from '../repositories/MoodRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type MoodRow = Database['public']['Tables']['moods']['Row'];
type MoodLevel = Database['public']['Enums']['mood_level'];

const MOOD_LEVELS: readonly MoodLevel[] = ['very_low', 'low', 'neutral', 'good', 'great'];

class MoodService {
  // ── Reads ──────────────────────────────────────────────────────────────────
  list(limit?: number): Promise<MoodRow[]> {
    return moodRepository.list(limit);
  }

  get(id: string): Promise<MoodRow | null> {
    return moodRepository.get(id);
  }

  /** Moods recorded within the last `days` days (inclusive of today). */
  recent(days: number): Promise<MoodRow[]> {
    return moodRepository.recent(days);
  }

  // ── Writes ──────────────────────────────────────────────────────────────────
  create(input: MoodInput): Promise<MoodRow> {
    if (input.level != null && !MOOD_LEVELS.includes(input.level)) {
      throw new RepositoryError(
        `MoodService.create: level must be one of ${MOOD_LEVELS.join(', ')}.`,
        { code: 'VALIDATION' },
      );
    }
    return moodRepository.create(input);
  }

  update(id: string, patch: MoodPatch): Promise<MoodRow> {
    return moodRepository.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return moodRepository.remove(id);
  }
}

export type { MoodRow, MoodLevel };
export const moodService = new MoodService();
export { RepositoryError };
export default moodService;
