/**
 * Guided Exercise Progress Repository
 *
 * Tracks step-by-step progress of users doing guided CBT/wellness exercises.
 * Authenticated via Supabase Auth. RLS enforces user-only access.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type Row = Database['public']['Tables']['guided_exercise_progress']['Row'];

export class GuidedProgressRepository extends BaseRepository<'guided_exercise_progress'> {
  constructor() {
    super('guided_exercise_progress');
  }

  /**
   * Fetch the active step-by-step progress for a specific exercise and the current user.
   */
  async get(exerciseId: string): Promise<Row | null> {
    try {
      const uid = await this.getCurrentUserId();
      const { data, error } = await this.client
        .from('guided_exercise_progress')
        .select('*')
        .eq('user_id', uid)
        .eq('exercise_id', exerciseId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      throw toRepositoryError(error, `GuidedProgressRepository.get(${exerciseId})`);
    }
  }

  /**
   * Save step-by-step progress (insert or update).
   */
  async save(
    exerciseId: string,
    currentStep: number,
    answers: Record<string, string>,
    aiReflections: Record<string, string>,
    status: 'in_progress' | 'completed',
    duration: number,
    completedAt?: Date | null,
    programId?: string | null,
    lessonId?: string | null,
    draftText?: string | null,
    timerState?: number | null,
    breathingCycle?: number | null
  ): Promise<Row> {
    try {
      const uid = await this.requireUserId();
      const payload = {
        user_id: uid,
        exercise_id: exerciseId,
        current_step: currentStep,
        answers,
        ai_reflections: aiReflections,
        status,
        duration,
        updated_at: new Date().toISOString(),
        ...(completedAt !== undefined ? { completed_at: completedAt?.toISOString() || null } : {}),
        program_id: programId || null,
        lesson_id: lessonId || null,
        draft_text: draftText || null,
        timer_state: timerState || null,
        breathing_cycle: breathingCycle || null
      };

      const { data, error } = await this.client
        .from('guided_exercise_progress')
        .upsert(payload, { onConflict: 'user_id,exercise_id' })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No row returned after saving guided exercise progress');
      return data;
    } catch (error) {
      throw toRepositoryError(error, `GuidedProgressRepository.save(${exerciseId})`);
    }
  }

  /**
   * Delete progress state (usually to reset or start over).
   */
  async remove(exerciseId: string): Promise<void> {
    try {
      const uid = await this.requireUserId();
      const { error } = await this.client
        .from('guided_exercise_progress')
        .delete()
        .eq('user_id', uid)
        .eq('exercise_id', exerciseId);

      if (error) throw error;
    } catch (error) {
      throw toRepositoryError(error, `GuidedProgressRepository.remove(${exerciseId})`);
    }
  }
}

export const guidedProgressRepository = new GuidedProgressRepository();
export default guidedProgressRepository;
