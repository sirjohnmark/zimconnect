-- ============================================================
-- ZimConnect Database Schema
-- Paste this into the Supabase SQL Editor and run it.
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- profiles: extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  phone         text,
  location      text,
  avatar_url    text,
  role          text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_suspended  boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  icon_url    text,
  sort_order  int DEFAULT 0
);

-- listings
CREATE TABLE IF NOT EXISTS public.listings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id    uuid REFERENCES public.categories(id),
  title          text NOT NULL,
  description    text,
  price          numeric(10,2),
  location       text,
  status         text DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive', 'sold', 'removed')),
  slug           text UNIQUE,
  search_vector  tsvector GENERATED ALWAYS AS (
                   to_tsvector('english', title || ' ' || coalesce(description, ''))
                 ) STORED,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- listing_images
CREATE TABLE IF NOT EXISTS public.listing_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  sort_order    int DEFAULT 0,
  is_primary    boolean DEFAULT false
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

-- Full-text search
CREATE INDEX IF NOT EXISTS listings_search_idx
  ON public.listings USING GIN (search_vector);

-- Common filter columns
CREATE INDEX IF NOT EXISTS listings_user_id_idx
  ON public.listings(user_id);

CREATE INDEX IF NOT EXISTS listings_category_id_idx
  ON public.listings(category_id);

CREATE INDEX IF NOT EXISTS listings_status_idx
  ON public.listings(status);

CREATE INDEX IF NOT EXISTS listings_slug_idx
  ON public.listings(slug);

CREATE INDEX IF NOT EXISTS listing_images_listing_id_idx
  ON public.listing_images(listing_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images  ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles_public_read"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_owner_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- categories policies (public read only — managed via Supabase dashboard)
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT
  USING (true);

-- listings policies
CREATE POLICY "listings_public_read"
  ON public.listings FOR SELECT
  USING (true);

CREATE POLICY "listings_auth_insert"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listings_owner_update"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "listings_owner_delete"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);

-- listing_images policies
CREATE POLICY "listing_images_public_read"
  ON public.listing_images FOR SELECT
  USING (true);

CREATE POLICY "listing_images_owner_insert"
  ON public.listing_images FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.listings WHERE id = listing_id
    )
  );

CREATE POLICY "listing_images_owner_delete"
  ON public.listing_images FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM public.listings WHERE id = listing_id
    )
  );

-- ============================================================
-- 4. SEED DATA — Categories
-- ============================================================

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Electronics',   'electronics',  1),
  ('Vehicles',      'vehicles',     2),
  ('Property',      'property',     3),
  ('Fashion',       'fashion',      4),
  ('Services',      'services',     5),
  ('Agriculture',   'agriculture',  6),
  ('Jobs',          'jobs',         7),
  ('Home & Garden', 'home-garden',  8),
  ('Sports',        'sports',       9),
  ('Other',         'other',        10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. SUPABASE STORAGE BUCKET
-- Run in Supabase dashboard → Storage → New bucket
-- OR use the SQL below (requires pg_net or Supabase CLI)
-- ============================================================

-- Bucket: listing-images
-- Settings: Public bucket = true
-- File size limit: 5242880 (5MB)
-- Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Storage RLS policies (add in Supabase dashboard → Storage → Policies):
--
-- Policy: "Allow public read on listing-images"
--   Operation: SELECT
--   Target: storage.objects
--   Bucket: listing-images
--   USING: bucket_id = 'listing-images'
--
-- Policy: "Allow authenticated upload to listing-images"
--   Operation: INSERT
--   Target: storage.objects
--   Bucket: listing-images
--   WITH CHECK: bucket_id = 'listing-images' AND auth.role() = 'authenticated'
--
-- Policy: "Allow owner delete from listing-images"
--   Operation: DELETE
--   Target: storage.objects
--   Bucket: listing-images
--   USING: bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]

-- ============================================================
-- 6. PHASE 2 — Admin columns (run after Phase 1 is complete)
-- These are already included in the CREATE TABLE above.
-- This block is for projects that ran an earlier schema version.
-- ============================================================

-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS role text DEFAULT 'user'
--     CHECK (role IN ('user', 'admin')),
--   ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;
--
-- CREATE POLICY "admin_full_access_listings"
--   ON public.listings
--   USING ((auth.jwt() ->> 'role') = 'admin');
