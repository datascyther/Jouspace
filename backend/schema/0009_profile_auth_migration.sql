-- Add onboarding_completed and last_login_at columns to profiles
alter table if exists public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists last_login_at timestamptz;

-- Update handle_new_user() trigger to populate new columns and auto-create user_preferences
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, username, last_login_at)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      'Jouspace User'
    ),
    new.raw_user_meta_data ->> 'username',
    now()
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id, theme, notifications_enabled, reminders, settings)
  values (
    new.id,
    'system',
    true,
    '{}'::jsonb,
    '{}'::jsonb
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
