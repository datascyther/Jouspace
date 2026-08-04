/**
 * AnalyticsService — application boundary for `analytics_events`.
 *
 * Thin facade over AnalyticsRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → AnalyticsService → AnalyticsRepository → Supabase
 *
 * `track` adds only trivial validation at the boundary (`event_name` is required).
 * `created_at` is intentionally left to the database default (the repository's
 * input type omits it), keeping this a thin pass-through.
 */

import { analyticsRepository } from '../repositories/AnalyticsRepository';
import type { AnalyticsEventInput } from '../repositories/AnalyticsRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type AnalyticsRow = Database['public']['Tables']['analytics_events']['Row'];

class AnalyticsService {
  /** Record an event. `user_id` may be omitted for anonymous telemetry. */
  track(input: AnalyticsEventInput): Promise<AnalyticsRow> {
    if (!input.event_name || input.event_name.trim().length === 0) {
      throw new RepositoryError('AnalyticsService.track: event_name is required.', {
        code: 'VALIDATION',
      });
    }
    return analyticsRepository.track(input);
  }

  /** List the current user's attributed events (anonymous events are excluded). */
  list(limit?: number): Promise<AnalyticsRow[]> {
    return analyticsRepository.list(limit);
  }

  get(id: number): Promise<AnalyticsRow | null> {
    return analyticsRepository.get(id);
  }
}

export type { AnalyticsRow };
export const analyticsService = new AnalyticsService();
export { RepositoryError };
export default analyticsService;
