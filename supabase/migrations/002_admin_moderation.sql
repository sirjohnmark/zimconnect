-- =============================================================================
-- ZimConnect — Admin Moderation Migration (idempotent)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend listing_status enum
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
-- 3. Helper function in PUBLIC schema (auth schema is managed by Supabase)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
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
-- ---------------------------------------------------------------------------
drop policy if exists "admin_view_all_listings"  on listings;
create policy "admin_view_all_listings"
  on listings for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admin_update_any_listing" on listings;
create policy "admin_update_any_listing"
  on listings for update
  to authenticated
  using    (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. RLS policies — profiles
-- ---------------------------------------------------------------------------
drop policy if exists "admin_read_all_profiles"   on profiles;
create policy "admin_read_all_profiles"
  on profiles for select
  to authenticated
  using (public.is_admin() or id = auth.uid());

drop policy if exists "admin_update_any_profile"  on profiles;
create policy "admin_update_any_profile"
  on profiles for update
  to authenticated
  using    (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Grant admin role (replace with your real user uuid)
-- ---------------------------------------------------------------------------
-- update profiles set role = 'admin' where id = '<your-user-uuid>';
