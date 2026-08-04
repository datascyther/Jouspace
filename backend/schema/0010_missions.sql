-- =============================================================================
-- Jouspace — Sprint H2 — missions table (Home Intelligence Layer)
-- =============================================================================
-- Mirror of supabase/migrations/0009_missions.sql for schema-reference parity.
-- One mission per user per day (assigned_for_date). "Today's Mission" on the
-- Home screen reads the row for today, deriving it from the active journey's
-- current program's first incomplete lesson when none exists yet.
-- Self-contained: enum + table + indexes + RLS + policy.

create type mission_status as enum ('pending', 'active', 'completed', 'skipped');

create table if not exists public.missions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  title             text not null,
  description       text,
  status            mission_status not null default 'pending',
  source            text not null default 'system',   -- system | journey | ai | recommendation
  program_id        uuid references public.programs (id) on delete set null,
  lesson_id         uuid references public.lessons  (id) on delete set null,
  assigned_for_date date not null default current_date,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists missions_user_id_idx   on public.missions (user_id);
create index if not exists missions_user_date_idx on public.missions (user_id, assigned_for_date desc);

-- Row Level Security: users access only their own missions.
alter table public.missions enable row level security;

drop policy if exists missions_crud on public.missions;
create policy missions_crud on public.missions
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
