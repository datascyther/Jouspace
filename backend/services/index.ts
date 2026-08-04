/**
 * Service Layer — public API
 *
 * The ViewModel/UI must import services from here (or individual files) and
 * NEVER touch repositories or the Supabase client directly. This matches the
 * existing `AuthService` precedent:
 *
 *    UI / ViewModel → <Entity>Service → <Entity>Repository → Supabase
 */

import type { Database } from '../database.types';

import { authService } from './AuthService';
import { moodService } from './MoodService';
import { sessionService } from './SessionService';
import { profileService } from './ProfileService';
import { recommendationService } from './RecommendationService';
import { programService } from './ProgramService';
import { lessonService } from './LessonService';
import { exerciseService } from './ExerciseService';
import { progressService } from './ProgressService';
import { achievementService } from './AchievementService';
import { journalService } from './JournalService';
import { notificationService } from './NotificationService';
import { userPreferencesService } from './UserPreferencesService';
import { analyticsService } from './AnalyticsService';
import { missionService } from './MissionService';

// ── Auth (pre-existing, keep intact) ─────────────────────────────────────────
export { authService } from './AuthService';
export type { AuthSession, AuthUser } from './AuthService';
export {
  PROTECTED_ROUTES,
  isRouteProtected,
  assertAuthenticated,
  NotAuthenticatedError,
} from './authGuard';

// ── Domain services (singletons) ─────────────────────────────────────────────
export {
  moodService,
  sessionService,
  profileService,
  recommendationService,
  programService,
  lessonService,
  exerciseService,
  progressService,
  achievementService,
  journalService,
  notificationService,
  userPreferencesService,
  analyticsService,
  missionService,
};

// Row types surfaced by the service boundary (sourced from each service file).
export type {
  MoodRow,
  MoodLevel,
  SessionRow,
  ProfileRow,
  RecommendationRow,
  ProgramRow,
  LessonRow,
  ExerciseRow,
  ProgressRow,
  AchievementRow,
  JournalRow,
  NotificationRow,
  MissionRow,
  PreferencesRow,
  AnalyticsRow,
} from './rowTypes';

// Re-export the input/patch types the callers need, sourced from the
// repositories so services remain the only boundary feature code imports.
export type {
  MoodInput,
  MoodPatch,
  SessionInput,
  SessionPatch,
  ProfilePatch,
  RecommendationInput,
  RecommendationPatch,
  ProgramInput,
  ProgramPatch,
  LessonInput,
  LessonPatch,
  ProgressInput,
  ProgressPatch,
  AchievementInput,
  AchievementPatch,
  JournalInput,
  JournalPatch,
  NotificationInput,
  NotificationPatch,
  MissionInput,
  MissionPatch,
  PreferencesInput,
  PreferencesPatch,
  AnalyticsEventInput,
} from '../repositories';

// Domain enums the service layer surfaces (derived from the typed schema so the
// service boundary is the only place feature code names them).
export type JourneyStatus = Database['public']['Enums']['journey_status'];
export type RecommendationStatus = Database['public']['Enums']['recommendation_status'];
export type AchievementType = Database['public']['Enums']['achievement_type'];
export type ExerciseType = Database['public']['Enums']['exercise_type'];
export type MissionStatus = Database['public']['Enums']['mission_status'];

// ── Convenience namespace ────────────────────────────────────────────────────
/** Bundles every service singleton for convenient `services.mood.list()` style imports. */
export const services = {
  auth: authService,
  mood: moodService,
  session: sessionService,
  profile: profileService,
  recommendation: recommendationService,
  program: programService,
  lesson: lessonService,
  exercise: exerciseService,
  progress: progressService,
  achievement: achievementService,
  journal: journalService,
  notification: notificationService,
  userPreferences: userPreferencesService,
  analytics: analyticsService,
  mission: missionService,
} as const;

export default services;
