-- =============================================================================
-- Jouspace — Sprint S0.9 — Security & Performance Hardening
-- =============================================================================
-- 1. Revoke EXECUTE on SECURITY DEFINER functions from public/anonymous roles
--    (prevents unauthenticated REST API callers from invoking them)
-- 2. Move pg_trgm from public to extensions schema (security lint 0014)
-- 3. Drop redundant notifications_mark_read policy (duplicates notifications_crud)
-- =============================================================================

-- 1. Revoke public EXECUTE on SECURITY DEFINER functions -----------------------
-- handle_new_user: only needed by the auth.users insert trigger, not by REST callers
revoke execute on function public.handle_new_user from public, anon, authenticated;

-- rls_auto_enable: setup utility, not for runtime callers
revoke execute on function public.rls_auto_enable from public, anon, authenticated;

-- 2. Move pg_trgm from public to extensions schema -----------------------------
-- Dropping and recreating in the extensions schema removes it from the public
-- API surface (security best practice: extensions should not live in public).
drop extension if exists pg_trgm;
create extension if not exists pg_trgm with schema extensions;

-- 3. Drop redundant notifications_mark_read policy -----------------------------
-- notifications_crud already handles all operations including update.
drop policy if exists notifications_mark_read on public.notifications;
