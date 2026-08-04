-- =============================================================================
-- Jouspace — Sprint S0.6 — Storage Buckets & Storage RLS
-- =============================================================================
-- Buckets: avatars, journal, media, exports  (all PRIVATE — no public read).
-- Files are namespaced by `user_id/` so Storage RLS enforces own-data access.
-- =============================================================================

-- Buckets ----------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars',  'avatars',  false),
  ('journal',  'journal',  false),
  ('media',    'media',    false),
  ('exports',  'exports',  false)
on conflict (id) do update set public = excluded.public;

-- Helper: first path segment must equal the caller's user id.
-- e.g. "avatars/<uid>/profile.png"  =>  foldername(name)[1] = <uid>

-- avatars ----------------------------------------------------------------------
drop policy if exists avatars_owner on storage.objects;
create policy avatars_owner on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- journal ----------------------------------------------------------------------
drop policy if exists journal_owner on storage.objects;
create policy journal_owner on storage.objects
  for all to authenticated
  using (bucket_id = 'journal' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'journal' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- media ------------------------------------------------------------------------
drop policy if exists media_owner on storage.objects;
create policy media_owner on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- exports ----------------------------------------------------------------------
drop policy if exists exports_owner on storage.objects;
create policy exports_owner on storage.objects
  for all to authenticated
  using (bucket_id = 'exports' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'exports' and (storage.foldername(name))[1] = (select auth.uid())::text);
