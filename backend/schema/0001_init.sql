-- =============================================================================
-- Jouspace — Sprint S0.3 — Database Schema (initial migration)
-- =============================================================================
-- Applied via: supabase db push  (files symlinked into supabase/migrations)
-- Idempotent: safe to re-run. All objects use CREATE IF NOT EXISTS / guards.
-- Design notes:
--   * Every user-owned table carries a `user_id uuid` FK -> profiles.id and is
--     protected by RLS in 0002_rls.sql (strictly own-data).
--   * Timestamps use timestamptz. created_at defaults now(); updated_at is
--     maintained by the cross-cutting trigger set_updated_at().
--   * Exercise type-specific payloads live in a `content jsonb` column keyed by
--     the `type` enum (mirrors src/types/exercise.types.ts).
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";     -- fuzzy search on titles/notes

-- Enums -----------------------------------------------------------------------
do $$ begin
  create type journey_status as enum ('active', 'completed', 'paused', 'archived');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type program_status as enum ('locked', 'unlocked', 'in_progress', 'completed');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type lesson_status as enum ('locked', 'unlocked', 'in_progress', 'completed');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type exercise_type as enum ('guided', 'journal', 'adhd_game', 'breathing');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('active', 'completed', 'abandoned');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type progress_status as enum ('not_started', 'in_progress', 'completed');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type recommendation_status as enum ('pending', 'accepted', 'dismissed', 'completed');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type achievement_type as enum ('streak', 'milestone', 'level', 'custom');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type mood_level as enum ('very_low', 'low', 'neutral', 'good', 'great');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('achievement', 'recommendation', 'reminder', 'system', 'social');
  exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('push', 'in_app', 'email');
  exception when duplicate_object then null; end $$;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- profiles --------------------------------------------------------------------
-- One row per auth user. Auto-created by handle_new_user() trigger (below).
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text not null default 'Jouspace User',
  avatar_url   text,
  bio          text,
  timezone     text default 'UTC',
  locale       text default 'en',
  is_private   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists profiles_username_idx on public.profiles (username);

-- journeys ---------------------------------------------------------------------
create table if not exists public.journeys (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  title             text not null,
  description       text,
  category          text not null default 'general',
  status            journey_status not null default 'active',
  -- current_program_id FK is added after `programs` exists (see bottom of file)
  current_program_id uuid,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists journeys_user_id_idx on public.journeys (user_id);
create index if not exists journeys_user_status_idx on public.journeys (user_id, status);

-- programs ---------------------------------------------------------------------
create table if not exists public.programs (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid not null references public.journeys (id) on delete cascade,
  title       text not null,
  description text,
  position    integer not null default 0,
  status      program_status not null default 'locked',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists programs_journey_id_idx on public.programs (journey_id);
create index if not exists programs_journey_position_idx on public.programs (journey_id, position);

-- lessons ----------------------------------------------------------------------
create table if not exists public.lessons (
  id         uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  title      text not null,
  description text,
  position   integer not null default 0,
  status     lesson_status not null default 'locked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lessons_program_id_idx on public.lessons (program_id);
create index if not exists lessons_program_position_idx on public.lessons (program_id, position);

-- exercises --------------------------------------------------------------------
-- `content jsonb` holds type-specific fields (pattern, prompts, instructions…).
create table if not exists public.exercises (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid references public.lessons (id) on delete cascade,
  title       text not null,
  description text,
  type        exercise_type not null,
  duration    integer not null check (duration >= 0),      -- seconds
  position    integer not null default 0,
  content     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists exercises_lesson_id_idx on public.exercises (lesson_id);
create index if not exists exercises_type_idx on public.exercises (type);
create index if not exists exercises_lesson_position_idx on public.exercises (lesson_id, position);

-- sessions ---------------------------------------------------------------------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  program_id  uuid references public.programs (id) on delete set null,
  journey_id  uuid references public.journeys (id) on delete set null,
  status      session_status not null default 'active',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  duration    integer check (duration is null or duration >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_user_started_idx on public.sessions (user_id, started_at desc);
create index if not exists sessions_exercise_id_idx on public.sessions (exercise_id);

-- progress ---------------------------------------------------------------------
create table if not exists public.progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  journey_id  uuid references public.journeys (id) on delete cascade,
  program_id  uuid references public.programs (id) on delete cascade,
  lesson_id   uuid references public.lessons (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete cascade,
  status      progress_status not null default 'not_started',
  score       integer check (score is null or (score >= 0 and score <= 100)),
  completed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- A given leaf entity has at most one progress row per user (expression index).
create unique index if not exists progress_user_leaf_uniq on public.progress (
  user_id,
  (coalesce(exercise_id, '00000000-0000-0000-0000-000000000000'::uuid)),
  (coalesce(lesson_id,   '00000000-0000-0000-0000-000000000000'::uuid)),
  (coalesce(program_id,  '00000000-0000-0000-0000-000000000000'::uuid))
);
create index if not exists progress_user_id_idx on public.progress (user_id);
create index if not exists progress_exercise_idx on public.progress (exercise_id);
create index if not exists progress_lesson_idx on public.progress (lesson_id);

-- recommendations --------------------------------------------------------------
create table if not exists public.recommendations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  journey_id  uuid references public.journeys (id) on delete set null,
  program_id  uuid references public.programs (id) on delete set null,
  exercise_id uuid references public.exercises (id) on delete set null,
  reason      text,
  source      text not null default 'engine',   -- 'engine' | 'ai' | 'manual'
  priority    integer not null default 0,
  status      recommendation_status not null default 'pending',
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists recommendations_user_id_idx on public.recommendations (user_id);
create index if not exists recommendations_user_status_idx on public.recommendations (user_id, status);

-- achievements ----------------------------------------------------------------
create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        achievement_type not null,
  title       text not null,
  description text,
  metadata    jsonb not null default '{}'::jsonb,
  earned_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists achievements_user_id_idx on public.achievements (user_id);
create index if not exists achievements_user_type_idx on public.achievements (user_id, type);

-- =============================================================================
-- SUPPORT TABLES
-- =============================================================================

-- moods ------------------------------------------------------------------------
create table if not exists public.moods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  level       mood_level not null,
  note        text,
  recorded_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists moods_user_id_idx on public.moods (user_id);
create index if not exists moods_user_recorded_idx on public.moods (user_id, recorded_at desc);

-- journal_entries --------------------------------------------------------------
create table if not exists public.journal_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  title        text,
  body         text,
  mood_id      uuid references public.moods (id) on delete set null,
  attachments  jsonb not null default '[]'::jsonb,   -- [{bucket,path,name}]
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists journal_entries_user_id_idx on public.journal_entries (user_id);
create index if not exists journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);

-- notifications ----------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        notification_type not null,
  channel     notification_channel not null default 'in_app',
  title       text not null,
  body        text,
  data        jsonb not null default '{}'::jsonb,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, read, created_at desc);

-- user_preferences -------------------------------------------------------------
create table if not exists public.user_preferences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade unique,
  theme       text not null default 'system',          -- system | light | dark
  notifications_enabled boolean not null default true,
  reminders   jsonb not null default '{}'::jsonb,       -- {daily: "09:00", ...}
  settings    jsonb not null default '{}'::jsonb,       -- arbitrary app settings
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- analytics_events -------------------------------------------------------------
-- Append-only. user_id nullable to allow anonymous telemetry.
create table if not exists public.analytics_events (
  id          bigserial primary key,
  user_id     uuid references public.profiles (id) on delete set null,
  event_name  text not null,
  properties  jsonb not null default '{}'::jsonb,
  session_id  text,
  created_at  timestamptz not null default now()
);
create index if not exists analytics_events_user_id_idx on public.analytics_events (user_id);
create index if not exists analytics_events_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- updated_at maintenance -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger journeys_set_updated_at      before update on public.journeys      for each row execute function public.set_updated_at();
create trigger programs_set_updated_at      before update on public.programs      for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at       before update on public.lessons       for each row execute function public.set_updated_at();
create trigger exercises_set_updated_at     before update on public.exercises     for each row execute function public.set_updated_at();
create trigger progress_set_updated_at      before update on public.progress      for each row execute function public.set_updated_at();
create trigger recommendations_set_updated_at before update on public.recommendations for each row execute function public.set_updated_at();
create trigger journal_entries_set_updated_at before update on public.journal_entries for each row execute function public.set_updated_at();
create trigger user_preferences_set_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();

-- Auto-create a profile row on new auth user ----------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Jouspace User'),
    new.raw_user_meta_data ->> 'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Deferred FK: journeys -> programs (programs defined after journeys) -----------
alter table public.journeys
  drop constraint if exists journeys_current_program_id_fkey;
alter table public.journeys
  add constraint journeys_current_program_id_fkey
  foreign key (current_program_id) references public.programs (id) on delete set null;
