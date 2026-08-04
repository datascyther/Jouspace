# Sprint S0.11 — Service Layer

## 1. Objective

Introduce a thin **service layer** between the UI/ViewModel and the existing
Repository layer for the Jouspace domain entities, so the call chain becomes:

```
UI → ViewModel → <Entity>Service → <Entity>Repository → Supabase
```

The Repository layer (`backend/repositories/`) already owns the Supabase client
and all data access. A precedent already existed for `auth` (`AuthService.ts`),
where the UI talks only to `AuthService`, which delegates to `AuthRepository`.
This sprint extends that exact pattern to the remaining 14 domain entities,
giving the ViewModel/UI a single, stable, typed boundary to code against and
centralising any application-level validation/orchestration in one place.

## 2. Architecture Decisions

- **Boundary enforcement.** The Service layer is now the *only* backend boundary
  the ViewModel/UI is permitted to import. Features must never import a
  Repository or `@supabase/supabase-js`/`backend/client.ts` directly. This
  implements the required chain `UI → ViewModel → Service → Repository → Supabase`
  and matches how `AuthService` already works (it remains intact and unchanged in
  behaviour).
- **Thin facade, not a logic dump.** Each service is a pass-through over its
  corresponding repository singleton. No business logic was invented. The only
  additions are *trivial boundary validation* that clearly belongs at the edge
  (e.g. `NotificationService.create` requires a `title`, `MoodService.create`
  validates the `level` enum, `SessionService.start` requires a
  `program_id`/`journey_id`, `AnalyticsService.track` requires an `event_name`).
- **Single ownership of Supabase.** Repositories remain the sole owner of the
  `supabase` client. Services import **only** from `../repositories` (and
  `../repositories/baseRepository` for `RepositoryError`) plus `../database.types`
  for *type-only* schema/enum references. No service imports `@supabase/supabase-js`
  (except a type-only import if unavoidable — none were needed) and none import
  `../client`.
- **Error propagation.** Services never swallow errors. `RepositoryError` thrown
  by repositories propagates unchanged to callers. Validation failures throw a
  `RepositoryError` with `code: 'VALIDATION'` so callers handle them uniformly.
- **Singleton + default export.** Each service follows the `AuthService` shape:
  a `class` + a `export const xService = new XService()` + `export default xService`.
- **No scope creep.** No UI/navigation changes, no repository modifications, no
  new repositories, no future-sprint work, no placeholder/stub methods. Every
  method is real and delegates correctly.

## 3. Folder Structure

```
backend/
├── client.ts                       (unchanged — owned by repositories)
├── database.types.ts               (unchanged — type-only imports only)
├── repositories/                   (unchanged — sole Supabase owner)
│   └── index.ts
└── services/
    ├── AuthService.ts              (pre-existing, unchanged behaviour)
    ├── authGuard.ts                (pre-existing, unchanged)
    ├── index.ts                    (EXTENDED — re-exports all services + types)
    ├── rowTypes.ts                 (NEW — barrel of Row/Level types)
    ├── JourneyService.ts           (NEW)
    ├── MoodService.ts              (NEW)
    ├── SessionService.ts           (NEW)
    ├── ProfileService.ts           (NEW)
    ├── RecommendationService.ts    (NEW)
    ├── ProgramService.ts           (NEW)
    ├── LessonService.ts            (NEW)
    ├── ExerciseService.ts          (NEW)
    ├── ProgressService.ts          (NEW)
    ├── AchievementService.ts       (NEW)
    ├── JournalService.ts           (NEW)
    ├── NotificationService.ts      (NEW)
    ├── UserPreferencesService.ts   (NEW)
    ├── AnalyticsService.ts         (NEW)
    └── SERVICE_LAYER_SPRINT.md     (this document)
```

## 4. Files Created

Service modules (13 domain services) + 2 supporting files:

- `backend/services/JourneyService.ts`
- `backend/services/MoodService.ts`
- `backend/services/SessionService.ts`
- `backend/services/ProfileService.ts`
- `backend/services/RecommendationService.ts`
- `backend/services/ProgramService.ts`
- `backend/services/LessonService.ts`
- `backend/services/ExerciseService.ts`
- `backend/services/ProgressService.ts`
- `backend/services/AchievementService.ts`
- `backend/services/JournalService.ts`
- `backend/services/NotificationService.ts`
- `backend/services/UserPreferencesService.ts`
- `backend/services/AnalyticsService.ts`
- `backend/services/rowTypes.ts` (barrel of Row/Level types)
- `backend/services/index.ts` (extended — `authService`/`authGuard` exports kept intact)

## 5. Complete Production Code

### `backend/services/JourneyService.ts`

```typescript
/**
 * JourneyService — application boundary for `journeys`.
 *
 * Thin facade over JourneyRepository. The ViewModel/UI must talk to this
 * service (never to the repository or Supabase directly), matching how
 * `AuthService` already works:
 *
 *    UI / ViewModel → JourneyService → JourneyRepository → Supabase
 */

import { journeyRepository } from '../repositories/JourneyRepository';
import type { JourneyInput, JourneyPatch } from '../repositories/JourneyRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type JourneyRow = Database['public']['Tables']['journeys']['Row'];
type JourneyStatus = Database['public']['Enums']['journey_status'];

export type { JourneyRow, JourneyStatus };

class JourneyService {
  // ── Reads ──────────────────────────────────────────────────────────────────
  list(): Promise<JourneyRow[]> {
    return journeyRepository.list();
  }

  get(id: string): Promise<JourneyRow | null> {
    return journeyRepository.get(id);
  }

  listByStatus(status: JourneyStatus): Promise<JourneyRow[]> {
    return journeyRepository.listByStatus(status);
  }

  // ── Writes ──────────────────────────────────────────────────────────────────
  create(input: JourneyInput): Promise<JourneyRow> {
    return journeyRepository.create(input);
  }

  update(id: string, patch: JourneyPatch): Promise<JourneyRow> {
    return journeyRepository.update(id, patch);
  }

  /** Link the active program to a journey. */
  setCurrentProgram(journeyId: string, programId: string): Promise<JourneyRow> {
    return journeyRepository.setCurrentProgram(journeyId, programId);
  }

  remove(id: string): Promise<void> {
    return journeyRepository.remove(id);
  }
}

export const journeyService = new JourneyService();
export { RepositoryError };
export default journeyService;
```

### `backend/services/MoodService.ts`

```typescript
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
```

### `backend/services/SessionService.ts`

```typescript
/**
 * SessionService — application boundary for `sessions`.
 *
 * Thin facade over SessionRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → SessionService → SessionRepository → Supabase
 */

import { sessionRepository } from '../repositories/SessionRepository';
import type { SessionInput, SessionPatch } from '../repositories/SessionRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type SessionRow = Database['public']['Tables']['sessions']['Row'];

class SessionService {
  // ── Reads ──────────────────────────────────────────────────────────────────
  list(): Promise<SessionRow[]> {
    return sessionRepository.list();
  }

  get(id: string): Promise<SessionRow | null> {
    return sessionRepository.get(id);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  start(input: SessionInput): Promise<SessionRow> {
    if (!input.program_id && !input.journey_id) {
      throw new RepositoryError(
        'SessionService.start: a session must be linked to a program_id or journey_id.',
        { code: 'VALIDATION' },
      );
    }
    return sessionRepository.start(input);
  }

  complete(id: string, patch: SessionPatch = {}): Promise<SessionRow> {
    return sessionRepository.complete(id, patch);
  }

  cancel(id: string): Promise<SessionRow> {
    return sessionRepository.cancel(id);
  }
}

export type { SessionRow };
export const sessionService = new SessionService();
export { RepositoryError };
export default sessionService;
```

### `backend/services/index.ts`

```typescript
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
import { journeyService } from './JourneyService';
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
  journeyService,
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
};

// Row types surfaced by the service boundary (sourced from each service file).
export type {
  JourneyRow,
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
  PreferencesRow,
  AnalyticsRow,
} from './rowTypes';

// Re-export the input/patch types the callers need, sourced from the
// repositories so services remain the only boundary feature code imports.
export type {
  JourneyInput,
  JourneyPatch,
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

// ── Convenience namespace ────────────────────────────────────────────────────
/** Bundles every service singleton for convenient `services.journey.list()` style imports. */
export const services = {
  auth: authService,
  journey: journeyService,
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
} as const;

export default services;
```

### Remaining services (method signatures)

All remaining services follow the same shape: `class` + `export const xService`,
`export { RepositoryError }`, `export default xService`, importing only their
repository singleton and `RepositoryError`.

**`ProfileService`** (delegate: `profileRepository`)
```typescript
getById(id: string): Promise<ProfileRow | null>
getCurrent(): Promise<ProfileRow | null>
update(id: string, patch: ProfilePatch): Promise<ProfileRow>
isUsernameAvailable(username: string): Promise<boolean>   // throws VALIDATION if empty
updateAvatar(path: string): Promise<ProfileRow>
```

**`RecommendationService`** (delegate: `recommendationRepository`)
```typescript
list(status?: RecommendationStatus): Promise<RecommendationRow[]>
get(id: string): Promise<RecommendationRow | null>
create(input: RecommendationInput): Promise<RecommendationRow>
accept(id: string, patch?: RecommendationPatch): Promise<RecommendationRow>
dismiss(id: string, patch?: RecommendationPatch): Promise<RecommendationRow>
complete(id: string, patch?: RecommendationPatch): Promise<RecommendationRow>
```

**`ProgramService`** (delegate: `programRepository`)
```typescript
listByJourney(journeyId: string): Promise<ProgramRow[]>
get(id: string): Promise<ProgramRow | null>
create(input: ProgramInput): Promise<ProgramRow>
update(id: string, patch: ProgramPatch): Promise<ProgramRow>
remove(id: string): Promise<void>
```

**`LessonService`** (delegate: `lessonRepository`)
```typescript
listByProgram(programId: string): Promise<LessonRow[]>
get(id: string): Promise<LessonRow | null>
create(input: LessonInput): Promise<LessonRow>
update(id: string, patch: LessonPatch): Promise<LessonRow>
remove(id: string): Promise<void>
```

**`ExerciseService`** (delegate: `exerciseRepository` — read-only content library)
```typescript
list(type?: ExerciseType): Promise<ExerciseRow[]>
listByLesson(lessonId: string): Promise<ExerciseRow[]>
get(id: string): Promise<ExerciseRow | null>
```

**`ProgressService`** (delegate: `progressRepository`)
```typescript
list(): Promise<ProgressRow[]>
get(id: string): Promise<ProgressRow | null>
create(input: ProgressInput): Promise<ProgressRow>
update(id: string, patch: ProgressPatch): Promise<ProgressRow>
remove(id: string): Promise<void>
```

**`AchievementService`** (delegate: `achievementRepository`)
```typescript
list(): Promise<AchievementRow[]>
listByType(type: AchievementType): Promise<AchievementRow[]>
get(id: string): Promise<AchievementRow | null>
create(input: AchievementInput): Promise<AchievementRow>
update(id: string, patch: AchievementPatch): Promise<AchievementRow>
remove(id: string): Promise<void>
```

**`JournalService`** (delegate: `journalRepository`)
```typescript
list(): Promise<JournalRow[]>
get(id: string): Promise<JournalRow | null>
create(input: JournalInput): Promise<JournalRow>   // throws VALIDATION if no title & no body
update(id: string, patch: JournalPatch): Promise<JournalRow>
remove(id: string): Promise<void>
```

**`NotificationService`** (delegate: `notificationRepository`)
```typescript
list(unreadOnly?: boolean): Promise<NotificationRow[]>
get(id: string): Promise<NotificationRow | null>
create(input: NotificationInput): Promise<NotificationRow>   // throws VALIDATION if no title
update(id: string, patch: NotificationPatch): Promise<NotificationRow>
markRead(id: string): Promise<NotificationRow>
markAllRead(): Promise<void>
remove(id: string): Promise<void>
```

**`UserPreferencesService`** (delegate: `userPreferencesRepository`)
```typescript
get(): Promise<PreferencesRow | null>
upsert(input: PreferencesInput): Promise<PreferencesRow>
update(patch: PreferencesPatch): Promise<PreferencesRow>
```

**`AnalyticsService`** (delegate: `analyticsRepository`)
```typescript
track(input: AnalyticsEventInput): Promise<AnalyticsRow>   // throws VALIDATION if no event_name
list(limit?: number): Promise<AnalyticsRow[]>
get(id: number): Promise<AnalyticsRow | null>
```

## 6. Security Considerations

- **No Supabase client in the boundary.** Services import only repositories and
  `RepositoryError`. Repositories remain the sole owner of the `supabase` client,
  so RLS + the repository-level `user_id` stamping/filtering (defence-in-depth)
  continue to be the only path to data. The service layer cannot bypass RLS.
- **`RepositoryError` propagation.** No swallowing of errors; validation failures
  surface as `RepositoryError` with `code: 'VALIDATION'`, giving the ViewModel a
  uniform error contract. Sensitive underlying messages are carried by
  `RepositoryError` (which already sanitises via `toRepositoryError`).
- **Input validation at the edge.** The only added logic is trivial boundary
  validation (`event_name`/`title`/`level`/session linkage). This rejects
  malformed input before it reaches the repository, but does not relax or
  override any repository/RLS guarantees.
- **Anonymous-safe analytics.** `AnalyticsService.track` delegates to
  `analyticsRepository.track`, which keeps `user_id` optional (matching the
  repository's deliberate anonymous-telemetry design); no forced stamping.
- **Read-only content library.** `ExerciseService` exposes no writes, preserving
  the repository's intentional read-only `exercises` design (writes require the
  service-role key, never exposed here).

## 7. Testing Checklist

- [ ] Each service method returns the repository result unchanged (happy path).
- [ ] `RepositoryError` thrown by a repository propagates out of the service.
- [ ] `journeyService.setCurrentProgram` delegates to `update({ current_program_id })`.
- [ ] `moodService.recent(days)` returns moods within the window.
- [ ] `moodService.create` rejects an invalid `level` with `RepositoryError`/`VALIDATION`.
- [ ] `sessionService.start` rejects input lacking `program_id` and `journey_id`.
- [ ] `sessionService.complete`/`cancel` delegate and set terminal status.
- [ ] `notificationService.markAllRead` delegates to the bulk update.
- [ ] `userPreferencesService.upsert` delegates to the repository upsert.
- [ ] `analyticsService.track` rejects an empty `event_name`.
- [ ] `journalService.create` rejects an entry with no `title` and no `body`.
- [ ] `notificationService.create` rejects a missing `title`.
- [ ] `profileService.isUsernameAvailable` rejects empty input.
- [ ] `services` barrel (`services.journey.list()` …) resolves all singletons.
- [ ] No service file imports `@supabase/supabase-js` or `../client` (grep check).
- [ ] `npx tsc --noEmit` reports zero errors in `backend/(services|repositories)`.
- [ ] No UI/navigation/repository/client/database.types files were modified.

## 8. Acceptance Criteria

- [x] `backend/services/<Entity>Service.ts` exists for all 14 domain entities
      (Journey, Mood, Session, Profile, Recommendation, Program, Lesson, Exercise,
      Progress, Achievement, Journal, Notification, UserPreferences, Analytics).
- [x] Each service is a thin facade over its repository singleton; the call chain
      `UI → ViewModel → Service → Repository → Supabase` is realised and matches
      the existing `AuthService` precedent.
- [x] High-level operations (list/get/create/update/remove + entity helpers such
      as `setCurrentProgram`, `recent`, `start`/`complete`, `markAllRead`,
      `upsert`, `track`) are exposed.
- [x] Services never import `@supabase/supabase-js` (except type-only) or
      `../client`; only `../repositories` and `../repositories/baseRepository`
      (`RepositoryError`) plus type-only `../database.types`.
- [x] `RepositoryError` is propagated (not swallowed); validation throws it with
      `code: 'VALIDATION'`.
- [x] `backend/services/index.ts` re-exports all new services and types while
      keeping `authService` + `authGuard` exports intact.
- [x] `npx tsc --noEmit -p tsconfig.json` reports **no errors** in
      `backend/(services|repositories)`.
- [x] No UI, navigation, repository, `client.ts`, or `database.types.ts` files
      were modified. No placeholder/stub methods; every method delegates.
- [x] Deliverable doc present at `backend/services/SERVICE_LAYER_SPRINT.md`.
