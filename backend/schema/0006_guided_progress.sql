-- =============================================================================
-- Jouspace — Sprint S5 — Guided Exercise Progress
-- =============================================================================

create table if not exists public.guided_exercise_progress (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  exercise_id    text not null,
  current_step   integer not null default 0,
  answers        jsonb not null default '{}'::jsonb,
  ai_reflections jsonb not null default '{}'::jsonb,
  status         text not null default 'in_progress',
  started_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz,
  duration       integer default 0
);

-- Unique index to prevent duplicate progress rows per user + exercise
create unique index if not exists guided_exercise_progress_user_exercise_idx 
  on public.guided_exercise_progress (user_id, exercise_id);

-- Enable RLS
alter table public.guided_exercise_progress enable row level security;

-- CRUD policy
create policy guided_exercise_progress_crud on public.guided_exercise_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime tracking
do $$
begin
  alter publication supabase_realtime add table public.guided_exercise_progress;
exception
  when duplicate_object then null;
end $$;

-- Trigger set_updated_at
create trigger guided_exercise_progress_set_updated_at 
  before update on public.guided_exercise_progress 
  for each row execute function public.set_updated_at();
