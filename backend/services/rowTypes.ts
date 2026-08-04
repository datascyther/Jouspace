/**
 * Row types surfaced by the service boundary.
 *
 * Centralizes the `Database` Row type aliases declared in each service so feature
 * code imports them from the service layer, never from repositories or
 * `database.types` directly.
 */

export type { JourneyRow } from './JourneyService';
export type { MoodRow, MoodLevel } from './MoodService';
export type { SessionRow } from './SessionService';
export type { ProfileRow } from './ProfileService';
export type { RecommendationRow } from './RecommendationService';
export type { ProgramRow } from './ProgramService';
export type { LessonRow } from './LessonService';
export type { ExerciseRow } from './ExerciseService';
export type { ProgressRow } from './ProgressService';
export type { AchievementRow } from './AchievementService';
export type { JournalRow } from './JournalService';
export type { NotificationRow } from './NotificationService';
export type { MissionRow } from './MissionService';
export type { PreferencesRow } from './UserPreferencesService';
export type { AnalyticsRow } from './AnalyticsService';
