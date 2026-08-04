/**
 * MissionService — application boundary for `missions` (Home Intelligence Layer).
 *
 * Thin facade over MissionRepository, matching how the other services work:
 *
 *    UI / ViewModel → MissionService → MissionRepository → Supabase
 *
 * `ensureTodaysMission()` guarantees a mission exists for today, deriving it
 * from the active journey's current program's first incomplete lesson when no
 * mission has been assigned yet.
 */

import { missionRepository } from '../repositories/MissionRepository';
import type { MissionInput, MissionPatch } from '../repositories/MissionRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type MissionRow = Database['public']['Tables']['missions']['Row'];

import { journeyService } from './JourneyService';
import { programService } from './ProgramService';
import { lessonService } from './LessonService';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

class MissionService {
  // ── Reads ──────────────────────────────────────────────────────────────────
  getTodaysMission(): Promise<MissionRow | null> {
    return missionRepository.getToday();
  }

  list(): Promise<MissionRow[]> {
    return missionRepository.list();
  }

  get(id: string): Promise<MissionRow | null> {
    return missionRepository.get(id);
  }

  // ── Derivation ──────────────────────────────────────────────────────────────
  /**
   * Return today's mission, creating one if none exists.
   * Derivation priority:
   *   1. Active journey → current program → first lesson not yet completed
   *   2. Active journey title (no program/lesson yet)
   *   3. Generic system mission
   */
  async ensureTodaysMission(): Promise<MissionRow> {
    const existing = await missionRepository.getToday();
    if (existing) return existing;

    const derived = await this.deriveMission();

    return missionRepository.create({
      title: derived.title,
      description: derived.description ?? null,
      source: derived.source,
      program_id: derived.programId ?? null,
      lesson_id: derived.lessonId ?? null,
      assigned_for_date: todayISODate(),
      status: 'active',
    });
  }

  private async deriveMission(): Promise<{
    title: string;
    description: string | null;
    source: string;
    programId: string | null;
    lessonId: string | null;
  }> {
    try {
      const journeys = await journeyService.listByStatus('active');
      const journey = journeys[0];
      if (!journey) {
        return {
          title: 'Take a mindful minute',
          description: 'A small pause goes a long way. Check in with yourself today.',
          source: 'system',
          programId: null,
          lessonId: null,
        };
      }

      if (journey.current_program_id) {
        const lessons = await lessonService.listByProgram(journey.current_program_id);
        const next = lessons.find((l) => l.status !== 'completed');
        if (next) {
          const program = await programService.get(journey.current_program_id);
          return {
            title: next.title,
            description:
              program?.description ??
              `Part of ${program?.title ?? journey.title}`,
            source: 'journey',
            programId: journey.current_program_id,
            lessonId: next.id,
          };
        }
      }

      return {
        title: journey.title,
        description: journey.description ?? null,
        source: 'journey',
        programId: journey.current_program_id ?? null,
        lessonId: null,
      };
    } catch {
      // Derivation must never block the home screen; fall back gracefully.
      return {
        title: 'Reflect on one thing you are grateful for',
        description: null,
        source: 'system',
        programId: null,
        lessonId: null,
      };
    }
  }

  // ── Writes ──────────────────────────────────────────────────────────────────
  create(input: MissionInput): Promise<MissionRow> {
    if (!input.title) {
      throw new RepositoryError('MissionService.create: title is required.', {
        code: 'VALIDATION',
      });
    }
    return missionRepository.create(input);
  }

  update(id: string, patch: MissionPatch): Promise<MissionRow> {
    return missionRepository.update(id, patch);
  }

  completeMission(id: string): Promise<MissionRow> {
    return missionRepository.complete(id);
  }

  remove(id: string): Promise<void> {
    return missionRepository.remove(id);
  }
}

export type { MissionRow };
export const missionService = new MissionService();
export { RepositoryError };
export default missionService;
