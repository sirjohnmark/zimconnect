-- =============================================================================
-- ZimConnect — Fix scalar subquery in listing_images RLS policies
-- =============================================================================
-- Root cause: owner insert/delete policies in 003 use a scalar subquery
--   auth.uid() = (select user_id from public.listings where id = listing_id)
-- which can raise "more than one row returned by a subquery" during evaluation.
-- Fix: rewrite both policies using EXISTS instead.
-- =============================================================================

drop policy if exists "listing_images: owner insert" on public.listing_images;
drop policy if exists "listing_images: owner delete" on public.listing_images;

create policy "listing_images: owner insert"
  on public.listing_images for insert
  with check (
    exists (
      select 1 from public.listings
      where id = listing_id
        and user_id = auth.uid()
    )
  );

create policy "listing_images: owner delete"
  on public.listing_images for delete
  using (
    exists (
      select 1 from public.listings
      where id = listing_id
        and user_id = auth.uid()
    )
  );
