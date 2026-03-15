-- =============================================================================
-- ZimConnect — Initial Schema Migration
-- Paste into Supabase SQL editor or run via: supabase db push
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
create type listing_status    as enum ('draft', 'active', 'sold', 'expired', 'deleted');
create type listing_condition as enum ('new', 'used_like_new', 'used_good', 'used_fair', 'for_parts');
create type price_type        as enum ('fixed', 'negotiable', 'free', 'contact');

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------------
create table categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  description    text,
  icon_url       text,
  parent_id      uuid references categories(id) on delete set null,
  listings_count int  not null default 0,
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now()
);

create index idx_categories_slug on categories(slug);
create index idx_categories_sort on categories(sort_order);

-- Seed categories
insert into categories (name, slug, sort_order) values
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
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text not null unique,
  display_name   text not null,
  bio            text,
  avatar_url     text,
  location       text,
  phone          text,
  is_verified    boolean not null default false,
  listings_count int     not null default 0,
  created_at     timestamptz not null default now()
);

create index idx_profiles_username on profiles(username);

-- Auto-create a profile row on new user signup (fallback for edge cases).
-- Primary profile creation happens in the signUp server action.
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- LISTINGS
-- ---------------------------------------------------------------------------
create table listings (
  id            uuid          primary key default gen_random_uuid(),
  slug          text          not null unique,
  title         text          not null,
  description   text          not null,
  price         numeric(12,2),
  price_type    price_type    not null default 'fixed',
  condition     listing_condition not null,
  status        listing_status not null default 'active',
  category_id   uuid          not null references categories(id),
  user_id       uuid          not null references auth.users(id) on delete cascade,
  location      text          not null,
  images        text[]        not null default '{}',
  views_count   int           not null default 0,
  is_featured   boolean       not null default false,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  expires_at    timestamptz,
  -- Full-text search vector (English + unaccent)
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'C')
  ) stored
);

-- Indexes
create index idx_listings_status          on listings(status);
create index idx_listings_category        on listings(category_id, status);
create index idx_listings_user            on listings(user_id, status);
create index idx_listings_featured        on listings(is_featured, status, created_at desc);
create index idx_listings_created         on listings(created_at desc);
create index idx_listings_search_vector   on listings using gin(search_vector);
create index idx_listings_price           on listings(price) where price is not null;

-- Keep updated_at current
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on listings
  for each row execute procedure set_updated_at();

-- Keep categories.listings_count accurate
create or replace function sync_category_listings_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' and new.status = 'active' then
    update categories set listings_count = listings_count + 1 where id = new.category_id;

  elsif TG_OP = 'DELETE' and old.status = 'active' then
    update categories set listings_count = greatest(listings_count - 1, 0) where id = old.category_id;

  elsif TG_OP = 'UPDATE' then
    -- becoming active
    if old.status != 'active' and new.status = 'active' then
      update categories set listings_count = listings_count + 1 where id = new.category_id;
    -- leaving active (sold, deleted, etc.)
    elsif old.status = 'active' and new.status != 'active' then
      update categories set listings_count = greatest(listings_count - 1, 0) where id = new.category_id;
    end if;
    -- category change while active
    if old.status = 'active' and new.status = 'active' and old.category_id != new.category_id then
      update categories set listings_count = greatest(listings_count - 1, 0) where id = old.category_id;
      update categories set listings_count = listings_count + 1             where id = new.category_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger listings_category_count
  after insert or update or delete on listings
  for each row execute procedure sync_category_listings_count();

-- ---------------------------------------------------------------------------
-- RPC FUNCTIONS (called by the app layer)
-- ---------------------------------------------------------------------------

-- Increment view count — called fire-and-forget by getListingBySlug
create or replace function increment_listing_views(listing_id uuid)
returns void language sql security definer as $$
  update listings set views_count = views_count + 1 where id = listing_id;
$$;

-- Increment/decrement profile listings_count
create or replace function increment_profile_listings_count(profile_id uuid)
returns void language sql security definer as $$
  update profiles set listings_count = listings_count + 1 where id = profile_id;
$$;

create or replace function decrement_profile_listings_count(profile_id uuid)
returns void language sql security definer as $$
  update profiles set listings_count = greatest(listings_count - 1, 0) where id = profile_id;
$$;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- CATEGORIES — public read, no public write
alter table categories enable row level security;

create policy "categories: public read"
  on categories for select using (true);

-- PROFILES — public read, owner write
alter table profiles enable row level security;

create policy "profiles: public read"
  on profiles for select using (true);

create policy "profiles: owner insert"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- LISTINGS — public reads active only; owner reads all their own
alter table listings enable row level security;

create policy "listings: public read active"
  on listings for select
  using (status = 'active');

create policy "listings: owner read all"
  on listings for select
  using (auth.uid() = user_id);

create policy "listings: owner insert"
  on listings for insert
  with check (auth.uid() = user_id);

create policy "listings: owner update"
  on listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "listings: owner delete"
  on listings for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- STORAGE BUCKET
-- ---------------------------------------------------------------------------
-- Run in Supabase dashboard or via CLI: supabase storage create listing-images
-- Then set these policies in the dashboard (Storage > listing-images > Policies):

-- Public read (anyone can view listing images):
--   USING (true)

-- Authenticated upload to own folder:
--   (storage.foldername(name))[1] = auth.uid()::text

-- Owner delete:
--   (storage.foldername(name))[1] = auth.uid()::text
