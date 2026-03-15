-- =============================================================================
-- ZimConnect — Admin Moderation Migration
-- Run in Supabase SQL editor or via: supabase db push
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend listing_status enum with moderation values
-- ---------------------------------------------------------------------------

alter type listing_status add value if not exists 'inactive';
alter type listing_status add value if not exists 'removed';

-- ---------------------------------------------------------------------------
-- 2. Add admin columns to profiles
-- ---------------------------------------------------------------------------

alter table profiles
  add column if not exists role         text    not null default 'user'
    check (role in ('user', 'admin')),
  add column if not exists is_suspended boolean not null default false;

-- ---------------------------------------------------------------------------
-- 3. Helper function — checks if the calling user is an admin
--    SECURITY DEFINER so it can read profiles regardless of RLS.
-- ---------------------------------------------------------------------------

create or replace function auth.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from   public.profiles
    where  id   = auth.uid()
    and    role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS policies — listings
--    (Assumes existing user-scoped policies already exist from migration 001.)
-- ---------------------------------------------------------------------------

-- Admins can view every listing regardless of status.
drop policy if exists "admin_view_all_listings" on listings;
create policy "admin_view_all_listings"
  on listings for select
  to authenticated
  using (auth.is_admin());

-- Admins can update any listing (e.g. change status, feature flag).
drop policy if exists "admin_update_any_listing" on listings;
create policy "admin_update_any_listing"
  on listings for update
  to authenticated
  using    (auth.is_admin())
  with check (auth.is_admin());

-- ---------------------------------------------------------------------------
-- 5. RLS policies — profiles
-- ---------------------------------------------------------------------------

-- Admins can read all profiles (sellers, users).
drop policy if exists "admin_read_all_profiles" on profiles;
create policy "admin_read_all_profiles"
  on profiles for select
  to authenticated
  using (auth.is_admin() or id = auth.uid());

-- Admins can update any profile (suspension, role assignment).
drop policy if exists "admin_update_any_profile" on profiles;
create policy "admin_update_any_profile"
  on profiles for update
  to authenticated
  using    (auth.is_admin())
  with check (auth.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Grant admin role to the first superuser (replace with real user id)
-- ---------------------------------------------------------------------------
-- update profiles set role = 'admin' where id = '<your-user-uuid>';
