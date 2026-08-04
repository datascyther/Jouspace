-- =============================================================================
-- Jouspace — Sprint S0.7 — Platform Optimizations (additive, non-breaking)
-- =============================================================================
-- Safe, clearly-beneficial hardening ONLY. This migration:
--   * adds covering indexes for unindexed foreign keys (performance lint 0001),
--   * adds single-column lookup indexes on frequently-filtered status/flag
--     columns (journeys.status, recommendations.status, notifications.read,
--     progress.status, sessions.status),
--   * pins `set_updated_at()` search_path (security lint 0011).
-- It does NOT weaken RLS, drop/alter any table shape, or change policy semantics.
-- Every statement uses CREATE INDEX IF NOT EXISTS / CREATE OR REPLACE so it is
-- idempotent and safe to re-run.
-- =============================================================================

-- 1. Covering indexes for unindexed foreign keys (per performance advisor) -------
create index if not exists journal_entries_mood_id_idx
  on public.journal_entries (mood_id);

create index if not exists journeys_current_program_id_idx
  on public.journeys (current_program_id);

create index if not exists progress_journey_id_idx
  on public.progress (journey_id);

create index if not exists progress_program_id_idx
  on public.progress (program_id);

create index if not exists recommendations_exercise_id_idx
  on public.recommendations (exercise_id);

create index if not exists recommendations_journey_id_idx
  on public.recommendations (journey_id);

create index if not exists recommendations_program_id_idx
  on public.recommendations (program_id);

create index if not exists sessions_journey_id_idx
  on public.sessions (journey_id);

create index if not exists sessions_program_id_idx
  on public.sessions (program_id);

-- 2. Single-column lookup indexes on frequently-filtered status/flag columns -----
create index if not exists journeys_status_idx
  on public.journeys (status);

create index if not exists recommendations_status_idx
  on public.recommendations (status);

create index if not exists notifications_read_idx
  on public.notifications (read);

create index if not exists progress_status_idx
  on public.progress (status);

create index if not exists sessions_status_idx
  on public.sessions (status);

-- 3. Pin search_path on the updated_at trigger (security lint 0011) --------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
