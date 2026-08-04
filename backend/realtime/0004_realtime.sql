-- =============================================================================
-- Jouspace — Sprint S0.7 — Realtime Configuration
-- =============================================================================
-- Realtime is opt-in per table. We enable it ONLY where live sync adds product
-- value, and explicitly AVOID enabling it everywhere (per sprint guidance):
--
--   ENABLED  (curated):  profiles, journeys, programs, lessons, sessions,
--                        progress, recommendations, achievements,
--                        notifications, user_preferences
--   DISABLED (by design): exercises (static content), moods, journal_entries
--                        (bulky / low live value), analytics_events (high volume)
--
-- Realtime respects RLS when "Realtime Authorization" is on in the dashboard,
-- so subscribers only receive rows they are allowed to see (own-data).
-- =============================================================================

do $$
declare
  t text;
begin
  -- Tables to publish for realtime.
  for t in
    select unnest(array[
      'public.profiles',
      'public.journeys',
      'public.programs',
      'public.lessons',
      'public.sessions',
      'public.progress',
      'public.recommendations',
      'public.achievements',
      'public.notifications',
      'public.user_preferences'
    ])
  loop
    begin
      execute format('alter publication supabase_realtime add table %s', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
