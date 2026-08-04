-- Migration 0007: Program & Lesson Progress tracking, recovery fields
-- Handles granular status and unlocks dynamically

-- Create program_lesson_progress table
create table if not exists public.program_lesson_progress (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  program_id          text not null,
  lesson_id           text, -- Nullable indicates program-level progress
  status              text not null default 'not_started', -- 'locked', 'available', 'in_progress', 'completed', 'mastered'
  completion_percent  integer not null default 0,
  last_opened_at      timestamptz,
  started_at          timestamptz,
  completed_at        timestamptz,
  updated_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

-- Unique index per user + program + lesson configuration
create unique index if not exists program_lesson_progress_user_prog_less_idx
  on public.program_lesson_progress (user_id, program_id, coalesce(lesson_id, ''));

-- Enable RLS
alter table public.program_lesson_progress enable row level security;

-- Policies for RLS
create policy program_lesson_progress_crud on public.program_lesson_progress
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Add table to realtime publication
do $$
begin
  alter publication supabase_realtime add table public.program_lesson_progress;
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- Update trigger
create trigger program_lesson_progress_set_updated_at 
  before update on public.program_lesson_progress 
  for each row execute function public.set_updated_at();

-- Alter guided_exercise_progress to support recovery columns
alter table public.guided_exercise_progress add column if not exists program_id text;
alter table public.guided_exercise_progress add column if not exists lesson_id text;
alter table public.guided_exercise_progress add column if not exists draft_text text;
alter table public.guided_exercise_progress add column if not exists timer_state integer;
alter table public.guided_exercise_progress add column if not exists breathing_cycle integer;
