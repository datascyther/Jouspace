/**
 * Program & Lesson Progress Repository
 *
 * Tracks locked, available, in_progress, completed, and mastered states
 * for CBT and Wellness programs/lessons.
 * Authenticated via Supabase Auth. RLS enforces user-only access.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type Row = Database['public']['Tables']['program_lesson_progress']['Row'];

export class ProgramLessonProgressRepository extends BaseRepository<'program_lesson_progress'> {
  constructor() {
    super('program_lesson_progress');
  }

  /**
   * Fetch progress for a program or a specific lesson.
   */
  async get(programId: string, lessonId: string | null = null): Promise<Row | null> {
    try {
      const uid = await this.getCurrentUserId();
      let query = this.client
        .from('program_lesson_progress')
        .select('*')
        .eq('user_id', uid)
        .eq('program_id', programId);

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      } else {
        query = query.is('lesson_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      throw toRepositoryError(error, `ProgramLessonProgressRepository.get(${programId}, ${lessonId})`);
    }
  }

  /**
   * Fetch all progress rows for the current user.
   */
  async getAll(): Promise<Row[]> {
    try {
      const uid = await this.getCurrentUserId();
      const { data, error } = await this.client
        .from('program_lesson_progress')
        .select('*')
        .eq('user_id', uid);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw toRepositoryError(error, 'ProgramLessonProgressRepository.getAll()');
    }
  }

  /**
   * Upsert a progress entry.
   */
  async save(
    programId: string,
    lessonId: string | null,
    status: 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered',
    completionPercent: number,
    lastOpenedAt?: Date | null,
    startedAt?: Date | null,
    completedAt?: Date | null
  ): Promise<Row> {
    try {
      const uid = await this.requireUserId();
      const payload: Record<string, any> = {
        user_id: uid,
        program_id: programId,
        lesson_id: lessonId,
        status,
        completion_percent: completionPercent,
        updated_at: new Date().toISOString(),
      };

      if (lastOpenedAt !== undefined) {
        payload.last_opened_at = lastOpenedAt ? lastOpenedAt.toISOString() : null;
      }
      if (startedAt !== undefined) {
        payload.started_at = startedAt ? startedAt.toISOString() : null;
      }
      if (completedAt !== undefined) {
        payload.completed_at = completedAt ? completedAt.toISOString() : null;
      }

      const { data, error } = await this.client
        .from('program_lesson_progress')
        .upsert(payload, { onConflict: 'user_id,program_id,coalesce(lesson_id, \'\')' })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No row returned after saving program/lesson progress');
      return data;
    } catch (error) {
      throw toRepositoryError(error, `ProgramLessonProgressRepository.save(${programId}, ${lessonId})`);
    }
  }

  /**
   * Delete progress state.
   */
  async remove(programId: string, lessonId: string | null = null): Promise<void> {
    try {
      const uid = await this.requireUserId();
      let query = this.client
        .from('program_lesson_progress')
        .delete()
        .eq('user_id', uid)
        .eq('program_id', programId);

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      } else {
        query = query.is('lesson_id', null);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      throw toRepositoryError(error, `ProgramLessonProgressRepository.remove(${programId}, ${lessonId})`);
    }
  }
}

export const programLessonProgressRepository = new ProgramLessonProgressRepository();
export default programLessonProgressRepository;
