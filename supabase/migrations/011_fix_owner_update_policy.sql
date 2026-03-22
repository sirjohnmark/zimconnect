-- =============================================================================
-- ZimConnect — Fix "more than one row" error in owner-update RLS policy
-- =============================================================================
-- Root cause: the `listings: owner update` with check clause in 005 contains
-- a scalar subquery  (select is_featured from listings where id = listings.id)
-- that PostgreSQL may evaluate against multiple row versions during UPDATE,
-- raising "more than one row returned by a subquery used as an expression".
--
-- Fix:
--   1. Recreate the owner-update policy WITHOUT the scalar subquery.
--   2. Enforce the is_featured immutability rule via a BEFORE UPDATE trigger
--      instead (triggers have access to OLD and NEW, policies do not).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Recreate the owner-update policy (no scalar subquery)
-- ---------------------------------------------------------------------------
drop policy if exists "listings: owner update" on public.listings;

create policy "listings: owner update"
  on public.listings for update
  using (
    auth.uid() = user_id
    and status not in ('removed', 'deleted')
  )
  with check (
    auth.uid() = user_id
  );

-- ---------------------------------------------------------------------------
-- 2. BEFORE UPDATE trigger — prevent non-admins from changing is_featured
-- ---------------------------------------------------------------------------
create or replace function public.guard_is_featured_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_featured <> OLD.is_featured and not public.is_admin() then
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
