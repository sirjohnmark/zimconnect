-- =============================================================================
-- ZimConnect — Listing Images + Storage (idempotent)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. listing_images table
-- ---------------------------------------------------------------------------
create table if not exists public.listing_images (
  id           uuid        primary key default gen_random_uuid(),
  listing_id   uuid        not null references public.listings(id) on delete cascade,
  storage_path text        not null,
  sort_order   int         not null default 0,
  is_primary   boolean     not null default false,
  created_at   timestamptz not null default now()
);

create unique index if not exists listing_images_one_primary_idx
  on public.listing_images(listing_id)
  where is_primary = true;

create index if not exists listing_images_listing_id_idx
  on public.listing_images(listing_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2. RLS for listing_images
-- ---------------------------------------------------------------------------
alter table public.listing_images enable row level security;

drop policy if exists "listing_images: public read"  on public.listing_images;
drop policy if exists "listing_images: owner insert" on public.listing_images;
drop policy if exists "listing_images: owner delete" on public.listing_images;
drop policy if exists "listing_images: admin all"    on public.listing_images;

create policy "listing_images: public read"
  on public.listing_images for select
  using (true);

create policy "listing_images: owner insert"
  on public.listing_images for insert
  with check (
    auth.uid() = (select user_id from public.listings where id = listing_id)
  );

create policy "listing_images: owner delete"
  on public.listing_images for delete
  using (
    auth.uid() = (select user_id from public.listings where id = listing_id)
  );

create policy "listing_images: admin all"
  on public.listing_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Storage policies
-- ---------------------------------------------------------------------------
drop policy if exists "storage listing-images: public read"  on storage.objects;
drop policy if exists "storage listing-images: owner upload" on storage.objects;
drop policy if exists "storage listing-images: owner delete" on storage.objects;
drop policy if exists "storage listing-images: admin delete" on storage.objects;

create policy "storage listing-images: public read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "storage listing-images: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage listing-images: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage listing-images: admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 5. Category emoji icons
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
