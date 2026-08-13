-- ─────────────────────────────────────────────────────────────────────────────
-- Jouspace — initial schema
--
-- Account-scoped journaling backend. Every table lives in `public`, has RLS
-- enabled, and is owned by the authenticated user (`auth.uid()`). No row is
-- reachable by the `anon` role; `authenticated` callers may only touch their
-- own rows. Service-role (trusted server) keeps full access.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles ──────────────────────────────────────────────────────────────────
-- 1:1 with auth.users. Auto-created on signup by the trigger below.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'You',
  joined_date  text not null default '',
  avatar_url   text,
  updated_at   timestamptz not null default now()
);

-- ── journal_entries ─────────────────────────────────────────────────────────
create table if not exists public.journal_entries (
  id         uuid primary key default gen_random_uuid (),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       text not null default '',   -- display label, e.g. "Aug 6"
  title      text not null default '',
  theme      text not null default '',
  content    text not null default '',
  created_at bigint not null default (extract(epoch from now())::bigint * 1000),
  updated_at bigint not null default (extract(epoch from now())::bigint * 1000)
);
create index if not exists journal_entries_user_id_idx
  on public.journal_entries (user_id);

-- ── custom_themes (user-created spaces/themes) ───────────────────────────────
create table if not exists public.custom_themes (
  id                 text primary key,             -- slug, e.g. 'my_morning'
  user_id            uuid not null references auth.users (id) on delete cascade,
  label              text not null,
  placeholder_title  text not null default '',
  placeholder_body   text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, id)
);

-- ── ai_chat_history (persisted 'chat' conversation) ──────────────────────────
create table if not exists public.ai_chat_history (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  messages   jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── ai_context (selected AI context) ─────────────────────────────────────────
create table if not exists public.ai_context (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  selection  jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── personalization (distilled memory notes) ─────────────────────────────────
create table if not exists public.personalization (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  schema_version  int  not null default 1,
  memory_notes    text not null default '',
  last_digest_at  bigint,
  last_entry_count int not null default 0,
  updated_at      timestamptz not null default now()
);

-- ── user_prefs (reminders, theme, nav, draft, runtime url, onboarding, perms) ─
create table if not exists public.user_prefs (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  reminders_enabled boolean not null default true,
  theme           text not null default 'system',  -- 'light' | 'dark' | 'system'
  nav             jsonb not null default '{}'::jsonb,
  draft           jsonb not null default '{}'::jsonb,
  runtime_url     text,
  onboarded       boolean not null default false,
  permissions     jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

-- ── Updated-at trigger (single function, reused everywhere) ──────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at ();

create or replace trigger trg_custom_themes_updated
  before update on public.custom_themes
  for each row execute function public.set_updated_at ();

create or replace trigger trg_ai_chat_history_updated
  before update on public.ai_chat_history
  for each row execute function public.set_updated_at ();

create or replace trigger trg_ai_context_updated
  before update on public.ai_context
  for each row execute function public.set_updated_at ();

create or replace trigger trg_personalization_updated
  before update on public.personalization
  for each row execute function public.set_updated_at ();

create or replace trigger trg_user_prefs_updated
  before update on public.user_prefs
  for each row execute function public.set_updated_at ();

-- ── Auto-create a profile row when a new auth user signs up ──────────────────
-- SECURITY DEFINER + fixed search_path: runs with owner privileges so it can
-- insert the profile row before the user has one. It is a trigger on
-- auth.users (not callable via the Data API), not an exposed function.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, joined_date)
  values (new.id, 'You', to_char(now(), 'Month YYYY'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Enable on every table. Policies combine `TO authenticated` (role check) with
-- an ownership predicate (`auth.uid()` = owner) — never role-only (BOLA/IDOR).
alter table public.profiles         enable row level security;
alter table public.journal_entries  enable row level security;
alter table public.custom_themes    enable row level security;
alter table public.ai_chat_history  enable row level security;
alter table public.ai_context       enable row level security;
alter table public.personalization  enable row level security;
alter table public.user_prefs       enable row level security;

-- profiles (PK = user id)
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
    using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

-- journal_entries (FK user_id)
create policy journal_select_own on public.journal_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy journal_insert_own on public.journal_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy journal_update_own on public.journal_entries
  for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy journal_delete_own on public.journal_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- custom_themes
create policy custom_themes_select_own on public.custom_themes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy custom_themes_insert_own on public.custom_themes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy custom_themes_update_own on public.custom_themes
  for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy custom_themes_delete_own on public.custom_themes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ai_chat_history (PK = user id)
create policy ai_chat_select_own on public.ai_chat_history
  for select to authenticated using ((select auth.uid()) = user_id);
create policy ai_chat_insert_own on public.ai_chat_history
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ai_chat_update_own on public.ai_chat_history
  for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy ai_chat_delete_own on public.ai_chat_history
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ai_context
create policy ai_context_select_own on public.ai_context
  for select to authenticated using ((select auth.uid()) = user_id);
create policy ai_context_insert_own on public.ai_context
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ai_context_update_own on public.ai_context
  for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy ai_context_delete_own on public.ai_context
  for delete to authenticated using ((select auth.uid()) = user_id);

-- personalization
create policy personalization_select_own on public.personalization
  for select to authenticated using ((select auth.uid()) = user_id);
create policy personalization_insert_own on public.personalization
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy personalization_update_own on public.personalization
  for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy personalization_delete_own on public.personalization
  for delete to authenticated using ((select auth.uid()) = user_id);

-- user_prefs
create policy user_prefs_select_own on public.user_prefs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy user_prefs_insert_own on public.user_prefs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_prefs_update_own on public.user_prefs
  for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_prefs_delete_own on public.user_prefs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Expose tables to the Data (REST) API for the authenticated role ──────────
-- Without these grants the tables are not reachable through the API even with
-- RLS enabled. `anon` is intentionally NOT granted — unauthenticated callers
-- get nothing.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.journal_entries,
  public.custom_themes,
  public.ai_chat_history,
  public.ai_context,
  public.personalization,
  public.user_prefs
to authenticated;

-- Service role (trusted server-side) keeps full access.
grant usage on schema public to service_role;
grant all privileges on table
  public.profiles,
  public.journal_entries,
  public.custom_themes,
  public.ai_chat_history,
  public.ai_context,
  public.personalization,
  public.user_prefs
to service_role;
