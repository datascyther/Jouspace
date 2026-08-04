/**
 * RecommendationService — application boundary for `recommendations`.
 *
 * Thin facade over RecommendationRepository. The ViewModel/UI must talk to this
 * service (never to the repository or Supabase directly), matching how
 * `AuthService` already works:
 *
 *    UI / ViewModel → RecommendationService → RecommendationRepository → Supabase
 */

import { recommendationRepository } from '../repositories/RecommendationRepository';
import type {
  RecommendationInput,
  RecommendationPatch,
} from '../repositories/RecommendationRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type RecommendationRow = Database['public']['Tables']['recommendations']['Row'];
type RecommendationStatus = Database['public']['Enums']['recommendation_status'];

class RecommendationService {
  list(status?: RecommendationStatus): Promise<RecommendationRow[]> {
    return recommendationRepository.list(status);
  }

  get(id: string): Promise<RecommendationRow | null> {
    return recommendationRepository.get(id);
  }

  create(input: RecommendationInput): Promise<RecommendationRow> {
    return recommendationRepository.create(input);
  }

  accept(id: string, patch: RecommendationPatch = {}): Promise<RecommendationRow> {
    return recommendationRepository.accept(id, patch);
  }

  dismiss(id: string, patch: RecommendationPatch = {}): Promise<RecommendationRow> {
    return recommendationRepository.dismiss(id, patch);
  }

  complete(id: string, patch: RecommendationPatch = {}): Promise<RecommendationRow> {
    return recommendationRepository.complete(id, patch);
  }
}

export type { RecommendationRow };
export const recommendationService = new RecommendationService();
export { RepositoryError };
export default recommendationService;
