/**
 * Jouspace — AI Runtime: Autonomous Intelligence (Phase 8 stub)
 *
 * Interfaces + no-op implementations. Phase 8 later turns Jouspace into a
 * proactive assistant (weekly summaries, mood prediction, adaptive journeys,
 * habit analysis). No behavior now; the orchestrator can depend on these
 * interfaces without triggering any action. No schema changes.
 */

import type { MemoryContext } from '../types';

export interface Insight {
  id: string;
  kind: 'mood_drop' | 'streak_risk' | 'progress' | 'checkin';
  message: string;
  confidence: number;
}

export interface InsightEngine {
  detect(ctx: MemoryContext): Promise<Insight[]>;
}

export class NoOpInsightEngine implements InsightEngine {
  async detect(_ctx: MemoryContext): Promise<Insight[]> {
    return [];
  }
}

export interface Prediction {
  target: string;
  value: number;
  confidence: number;
}

export interface PredictionEngine {
  predict(ctx: MemoryContext): Promise<Prediction[]>;
}

export class NoOpPredictionEngine implements PredictionEngine {
  async predict(_ctx: MemoryContext): Promise<Prediction[]> {
    return [];
  }
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
}

export interface RecommendationEngine {
  recommend(ctx: MemoryContext): Promise<Recommendation[]>;
}

export class NoOpRecommendationEngine implements RecommendationEngine {
  async recommend(_ctx: MemoryContext): Promise<Recommendation[]> {
    return [];
  }
}
