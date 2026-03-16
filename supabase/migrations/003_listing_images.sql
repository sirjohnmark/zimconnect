-- =============================================================================
-- ZimConnect — Listing Images + Storage
-- Run after 001_initial_schema.sql and 002_admin_moderation.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. listing_images table
--    Replaces the images text[] column on listings as the canonical image store.
--    Path format in Storage: {user_id}/{listing_id}/{uuid}.{ext}
-- ---------------------------------------------------------------------------

create table if not exists public.listing_images (
  id           uuid        primary key default gen_random_uuid(),
  listing_id   uuid        not null references public.listings(id) on delete cascade,
  storage_path text        not null,                -- relative path inside the bucket
  sort_order   int         not null default 0,
  is_primary   boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- Only one image per listing should be primary.
-- Enforced at app layer (first image = is_primary); DB-level partial unique index:
create unique index if not exists listing_images_one_primary_idx
  on public.listing_images(listing_id)
  where is_primary = true;

create index if not exists listing_images_listing_id_idx
  on public.listing_images(listing_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2. RLS for listing_images
-- ---------------------------------------------------------------------------

alter table public.listing_images enable row level security;

-- Anyone can view images (image URLs are public anyway).
create policy "listing_images: public read"
  on public.listing_images for select
  using (true);

-- Only the listing owner can add images.
create policy "listing_images: owner insert"
  on public.listing_images for insert
  with check (
    auth.uid() = (
      select user_id from public.listings where id = listing_id
    )
  );

-- Only the listing owner can delete images.
create policy "listing_images: owner delete"
  on public.listing_images for delete
  using (
    auth.uid() = (
      select user_id from public.listings where id = listing_id
    )
  );

-- Admins can manage any listing's images (moderation/removal).
create policy "listing_images: admin all"
  on public.listing_images for all
  to authenticated
  using (auth.is_admin())
  with check (auth.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Storage bucket: listing-images
--    Max 5 MB per file. MIME types restricted to JPEG / PNG / WebP.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880,                                            -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Storage policies on storage.objects
--    Path structure: {user_id}/{listing_id}/{uuid}.{ext}
--    (storage.foldername(name))[1] extracts the first path segment = user_id
-- ---------------------------------------------------------------------------

-- Public read — anyone can fetch listing images (bucket is public, belt-and-suspenders).
create policy "storage listing-images: public read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Authenticated upload — users can only write into their own folder.
create policy "storage listing-images: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owner delete — users can only delete files in their own folder.
create policy "storage listing-images: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can delete any listing image (content moderation).
create policy "storage listing-images: admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and auth.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 5. Update category seed with emoji icons
--    (Initial seed in 001 had no icon_url values.)
-- ---------------------------------------------------------------------------

update public.categories set icon_url = '📱' where slug = 'electronics';
update public.categories set icon_url = '🚗' where slug = 'vehicles';
update public.categories set icon_url = '🏠' where slug = 'property';
update public.categories set icon_url = '👗' where slug = 'fashion';
update public.categories set icon_url = '🔧' where slug = 'services';
update public.categories set icon_url = '🌾' where slug = 'agriculture';
update public.categories set icon_url = '💼' where slug = 'jobs';
update public.categories set icon_url = '🪴' where slug = 'home-garden';
update public.categories set icon_url = '⚽' where slug = 'sports';
update public.categories set icon_url = '📦' where slug = 'other';
