-- =============================================================================
-- ZimConnect — RLS Hardening (idempotent)
-- Run after 001–004.
--
-- Goals:
--   1. profiles.role cannot be escalated to 'admin' by a non-admin session
--   2. profiles.is_verified and profiles.is_suspended are admin-only fields
--   3. listings INSERT cannot set is_featured = true (seller-facing privilege)
--   4. listings UPDATE by owner blocked when status is 'removed' or 'deleted'
--   5. All existing policies get explanatory comments
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CHECK CONSTRAINT — prevent privilege escalation on profiles.role
--
-- A plain user calling UPDATE profiles SET role = 'admin' WHERE id = auth.uid()
-- would be allowed by the existing owner-update policy (auth.uid() = id).
-- This constraint blocks it at the DB level unconditionally.
--
-- Logic: if the incoming role is 'admin', the session must already be admin.
-- auth.is_admin() is defined in migration 002 (SECURITY DEFINER, reads profiles).
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists chk_profiles_no_self_escalation;

alter table public.profiles
  add constraint chk_profiles_no_self_escalation
  check (
    -- Any role is allowed … except 'admin' unless the session is already admin.
    role != 'admin' or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 2. CHECK CONSTRAINT — is_verified and is_suspended are admin-only fields
--
-- Enforced as a CHECK so it cannot be bypassed by any policy that allows
-- UPDATE, including the owner-update policy.
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists chk_profiles_admin_only_flags;

alter table public.profiles
  add constraint chk_profiles_admin_only_flags
  check (
    -- is_verified can only be true if set by an admin session.
    (is_verified  = false or public.is_admin()) and
    -- is_suspended can only be true if set by an admin session.
    (is_suspended = false or public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- 3. Rebuild listings RLS — full commented set
--
-- Drop all existing policies first so this file is idempotent.
-- ---------------------------------------------------------------------------
drop policy if exists "listings: public read active"    on public.listings;
drop policy if exists "listings: owner read all"        on public.listings;
drop policy if exists "listings: owner insert"          on public.listings;
drop policy if exists "listings: owner update"          on public.listings;
drop policy if exists "listings: owner delete"          on public.listings;
drop policy if exists "admin_view_all_listings"         on public.listings;
drop policy if exists "admin_update_any_listing"        on public.listings;

-- Public read: anonymous and authenticated users see active listings only.
-- Deleted/removed/draft listings are invisible to the public.
create policy "listings: public read active"
  on public.listings for select
  using (status = 'active');

-- Owner read all: sellers can see their own listings in every status
-- (draft, inactive, sold, etc.) from the dashboard.
create policy "listings: owner read all"
  on public.listings for select
  using (auth.uid() = user_id);

-- Owner insert: authenticated user can only create listings under their own user_id.
-- is_featured must be false — sellers cannot feature their own listings.
-- status defaults to 'draft' in the app; this policy enforces it at DB level too.
create policy "listings: owner insert"
  on public.listings for insert
  with check (
    auth.uid() = user_id
    and is_featured = false           -- sellers cannot self-feature
    and status in ('draft', 'active') -- only valid initial statuses
  );

-- Owner update: sellers can edit their own listings UNLESS the listing has been
-- moderated (status = 'removed' or 'deleted').  They also cannot flip
-- is_featured themselves — that requires an admin session.
create policy "listings: owner update"
  on public.listings for update
  using (
    auth.uid() = user_id
    and status not in ('removed', 'deleted')  -- locked after moderation
  )
  with check (
    auth.uid() = user_id
    and is_featured = (select is_featured from public.listings where id = listings.id)
    -- ^ is_featured cannot be changed by the owner; it keeps its current value
  );

-- Owner delete: soft-delete is handled by the app (UPDATE status → 'deleted'),
-- but we also permit hard DELETE so cascade cleanup works correctly if needed.
create policy "listings: owner delete"
  on public.listings for delete
  using (auth.uid() = user_id);

-- Admin read all: admins see every listing regardless of status for moderation.
create policy "admin_view_all_listings"
  on public.listings for select
  to authenticated
  using (public.is_admin());

-- Admin update any: admins can change status, is_featured, or any other field
-- on any listing (content moderation and featuring).
create policy "admin_update_any_listing"
  on public.listings for update
  to authenticated
  using    (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Rebuild profiles RLS — full commented set
-- ---------------------------------------------------------------------------
drop policy if exists "profiles: public read"       on public.profiles;
drop policy if exists "profiles: owner insert"      on public.profiles;
drop policy if exists "profiles: owner update"      on public.profiles;
drop policy if exists "admin_read_all_profiles"     on public.profiles;
drop policy if exists "admin_update_any_profile"    on public.profiles;

-- Public read: any visitor can view any profile (needed for seller profile pages).
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Owner insert: the signed-in user can only create their own profile row.
-- Called by the signUp server action immediately after auth.signUp().
create policy "profiles: owner insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Owner update: users can update their own display_name, bio, phone, location,
-- avatar_url.  The CHECKs above block role/is_verified/is_suspended changes.
create policy "profiles: owner update"
  on public.profiles for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin read: admins can read all profiles including suspended ones
-- (needed for the admin moderation dashboard).
create policy "admin_read_all_profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin() or id = auth.uid());

-- Admin update: admins can change is_suspended, role, is_verified on any profile.
-- The CHECK constraints still apply — role can only be set to 'admin' by an admin.
create policy "admin_update_any_profile"
  on public.profiles for update
  to authenticated
  using    (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Categories RLS — full commented set (no changes, just documenting)
-- ---------------------------------------------------------------------------
drop policy if exists "categories: public read" on public.categories;
drop policy if exists "categories: admin all"   on public.categories;

-- Public read: the category list is globally readable (homepage, browse pages).
create policy "categories: public read"
  on public.categories for select
  using (true);

-- Admin all: only admins can create, update, or delete categories.
-- Covers INSERT, UPDATE, DELETE in a single FOR ALL policy.
create policy "categories: admin all"
  on public.categories for all
  to authenticated
  using    (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. listing_images RLS — full commented set (no changes, just documenting)
-- ---------------------------------------------------------------------------
drop policy if exists "listing_images: public read"  on public.listing_images;
drop policy if exists "listing_images: owner insert" on public.listing_images;
drop policy if exists "listing_images: owner delete" on public.listing_images;
drop policy if exists "listing_images: admin all"    on public.listing_images;

-- Public read: images are public (the bucket is public too; belt-and-suspenders).
create policy "listing_images: public read"
  on public.listing_images for select
  using (true);

-- Owner insert: the user inserting the image row must own the parent listing.
create policy "listing_images: owner insert"
  on public.listing_images for insert
  with check (
    auth.uid() = (select user_id from public.listings where id = listing_id)
  );

-- Owner delete: the user deleting the image row must own the parent listing.
create policy "listing_images: owner delete"
  on public.listing_images for delete
  using (
    auth.uid() = (select user_id from public.listings where id = listing_id)
  );

-- Admin all: admins can insert or delete any image row (moderation, cleanup).
create policy "listing_images: admin all"
  on public.listing_images for all
  to authenticated
  using    (public.is_admin())
  with check (public.is_admin());
