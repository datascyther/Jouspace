-- =============================================================================
-- Jouspace — Sprint S0.4 — Row Level Security
-- =============================================================================
-- Non-negotiable: every user can ONLY access their own data.
-- * User-owned tables filter on `user_id = (select (select auth.uid()))`.
-- * profiles filters on `id = (select (select auth.uid()))`.
-- * programs / lessons resolve ownership through their parent journey.
-- * exercises is a shared CONTENT library: authenticated users may SELECT;
--   writes are reserved for service_role (backend / edge functions) which
--   bypasses RLS, so no user-write policies are defined (implicit deny).
-- * analytics_events allows anonymous-safe inserts (user_id nullable) and
--   read only of the caller's own rows.
-- All policies wrap (select auth.uid()) in (SELECT ...) to avoid per-row re-evaluation
-- (InitPlan optimization — see supabase/docs/guides/database/postgres/row-level-security).
-- =============================================================================

-- Enable RLS everywhere --------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.journeys        enable row level security;
alter table public.programs        enable row level security;
alter table public.lessons         enable row level security;
alter table public.exercises       enable row level security;
alter table public.sessions        enable row level security;
alter table public.progress        enable row level security;
alter table public.recommendations enable row level security;
alter table public.achievements    enable row level security;
alter table public.moods           enable row level security;
alter table public.journal_entries enable row level security;
alter table public.notifications   enable row level security;
alter table public.user_preferences enable row level security;
alter table public.analytics_events enable row level security;

-- profiles ---------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = (select auth.uid()));
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (id = (select auth.uid()));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (id = (select auth.uid()));

-- journeys ---------------------------------------------------------------------
drop policy if exists journeys_crud on public.journeys;
create policy journeys_crud on public.journeys
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- programs (ownership via journey) --------------------------------------------
drop policy if exists programs_crud on public.programs;
create policy programs_crud on public.programs
  for all
  using (exists (
    select 1 from public.journeys j
    where j.id = programs.journey_id and j.user_id = (select auth.uid())))
  with check (exists (
    select 1 from public.journeys j
    where j.id = programs.journey_id and j.user_id = (select auth.uid())));

-- lessons (ownership via program -> journey) ----------------------------------
drop policy if exists lessons_crud on public.lessons;
create policy lessons_crud on public.lessons
  for all
  using (exists (
    select 1 from public.programs p
    join public.journeys j on j.id = p.journey_id
    where p.id = lessons.program_id and j.user_id = (select auth.uid())))
  with check (exists (
    select 1 from public.programs p
    join public.journeys j on j.id = p.journey_id
    where p.id = lessons.program_id and j.user_id = (select auth.uid())));

-- exercises (shared content library) ------------------------------------------
-- Read-only for authenticated users; no insert/update/delete policies => users
-- cannot mutate (service_role still can). Anon is denied by default.
drop policy if exists exercises_select on public.exercises;
create policy exercises_select on public.exercises
  for select to authenticated using (true);

-- sessions ---------------------------------------------------------------------
drop policy if exists sessions_crud on public.sessions;
create policy sessions_crud on public.sessions
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- progress ---------------------------------------------------------------------
drop policy if exists progress_crud on public.progress;
create policy progress_crud on public.progress
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- recommendations --------------------------------------------------------------
drop policy if exists recommendations_crud on public.recommendations;
create policy recommendations_crud on public.recommendations
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- achievements ----------------------------------------------------------------
drop policy if exists achievements_crud on public.achievements;
create policy achievements_crud on public.achievements
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- moods ------------------------------------------------------------------------
drop policy if exists moods_crud on public.moods;
create policy moods_crud on public.moods
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- journal_entries --------------------------------------------------------------
drop policy if exists journal_entries_crud on public.journal_entries;
create policy journal_entries_crud on public.journal_entries
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- notifications ----------------------------------------------------------------
drop policy if exists notifications_crud on public.notifications;
create policy notifications_crud on public.notifications
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- user_preferences -------------------------------------------------------------
drop policy if exists user_preferences_crud on public.user_preferences;
create policy user_preferences_crud on public.user_preferences
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- analytics_events -------------------------------------------------------------
drop policy if exists analytics_events_select on public.analytics_events;
create policy analytics_events_select on public.analytics_events
  for select using (user_id = (select auth.uid()));
drop policy if exists analytics_events_insert on public.analytics_events;
create policy analytics_events_insert on public.analytics_events
  for insert with check (user_id = (select auth.uid()) or user_id is null);
-- No update/delete for users (immutable telemetry).
