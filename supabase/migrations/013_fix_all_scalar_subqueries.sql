-- =============================================================================
-- ZimConnect — Definitive fix: remove ALL scalar subqueries from RLS policies
-- =============================================================================
-- Scalar subqueries inside RLS policy expressions (using/with check) can raise
-- "more than one row returned by a subquery used as an expression" at runtime.
-- This migration drops and recreates every affected policy using EXISTS instead.
-- Safe to run multiple times (drop if exists before each create).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. listings: owner update  (was broken in 005_rls_hardening.sql)
--    Already fixed by 011, but included here so this file is self-contained.
-- ---------------------------------------------------------------------------
drop policy if exists "listings: owner update" on public.listings;

create policy "listings: owner update"
  on public.listings for update
  using  (auth.uid() = user_id and status not in ('removed', 'deleted'))
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. listing_images: owner insert  (broken in both 003 and 005)
-- ---------------------------------------------------------------------------
drop policy if exists "listing_images: owner insert" on public.listing_images;

create policy "listing_images: owner insert"
  on public.listing_images for insert
  with check (
    exists (
      select 1 from public.listings
      where id = listing_id
        and user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. listing_images: owner delete  (broken in both 003 and 005)
-- ---------------------------------------------------------------------------
drop policy if exists "listing_images: owner delete" on public.listing_images;

create policy "listing_images: owner delete"
  on public.listing_images for delete
  using (
    exists (
      select 1 from public.listings
      where id = listing_id
        and user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. BEFORE UPDATE trigger — guard is_featured changes (non-admins blocked)
--    Already created by 011, included here for completeness.
-- ---------------------------------------------------------------------------
create or replace function public.guard_is_featured_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_featured is distinct from OLD.is_featured and not public.is_admin() then
    raise exception 'is_featured can only be changed by an admin'
      using errcode = 'insufficient_privilege';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_guard_is_featured on public.listings;
create trigger trg_guard_is_featured
  before update on public.listings
  for each row
  execute function public.guard_is_featured_change();
