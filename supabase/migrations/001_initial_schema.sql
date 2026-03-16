-- =============================================================================
-- ZimConnect — Initial Schema Migration (idempotent)
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE / ON CONFLICT
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- ENUMS (skip if already exist)
-- ---------------------------------------------------------------------------
do $$ begin
  create type listing_status as enum ('draft', 'active', 'sold', 'expired', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_condition as enum ('new', 'used_like_new', 'used_good', 'used_fair', 'for_parts');
exception when duplicate_object then null; end $$;

do $$ begin
  create type price_type as enum ('fixed', 'negotiable', 'free', 'contact');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------------
create table if not exists categories (
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

create index if not exists idx_categories_slug on categories(slug);
create index if not exists idx_categories_sort on categories(sort_order);

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
create table if not exists profiles (
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

create index if not exists idx_profiles_username on profiles(username);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  if length(base_username) < 3 then
    base_username := 'user';
  end if;

  final_username := base_username;
  loop
    exit when not exists (select 1 from profiles where username = final_username);
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', final_username)
  )
  on conflict (id) do nothing;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- LISTINGS
-- ---------------------------------------------------------------------------
create table if not exists listings (
  id            uuid              primary key default gen_random_uuid(),
  slug          text              not null unique,
  title         text              not null,
  description   text              not null,
  price         numeric(12,2),
  price_type    price_type        not null default 'fixed',
  condition     listing_condition not null,
  status        listing_status    not null default 'active',
  category_id   uuid              not null references categories(id),
  user_id       uuid              not null references auth.users(id) on delete cascade,
  location      text              not null,
  images        text[]            not null default '{}',
  views_count   int               not null default 0,
  is_featured   boolean           not null default false,
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now(),
  expires_at    timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'C')
  ) stored
);

create index if not exists idx_listings_status        on listings(status);
create index if not exists idx_listings_category      on listings(category_id, status);
create index if not exists idx_listings_user          on listings(user_id, status);
create index if not exists idx_listings_featured      on listings(is_featured, status, created_at desc);
create index if not exists idx_listings_created       on listings(created_at desc);
create index if not exists idx_listings_search_vector on listings using gin(search_vector);
create index if not exists idx_listings_price         on listings(price) where price is not null;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_updated_at on listings;
create trigger listings_updated_at
  before update on listings
  for each row execute procedure set_updated_at();

create or replace function sync_category_listings_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' and new.status = 'active' then
    update categories set listings_count = listings_count + 1 where id = new.category_id;

  elsif TG_OP = 'DELETE' and old.status = 'active' then
    update categories set listings_count = greatest(listings_count - 1, 0) where id = old.category_id;

  elsif TG_OP = 'UPDATE' then
    if old.status != 'active' and new.status = 'active' then
      update categories set listings_count = listings_count + 1 where id = new.category_id;
    elsif old.status = 'active' and new.status != 'active' then
      update categories set listings_count = greatest(listings_count - 1, 0) where id = new.category_id;
    end if;
    if old.status = 'active' and new.status = 'active' and old.category_id != new.category_id then
      update categories set listings_count = greatest(listings_count - 1, 0) where id = old.category_id;
      update categories set listings_count = listings_count + 1             where id = new.category_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists listings_category_count on listings;
create trigger listings_category_count
  after insert or update or delete on listings
  for each row execute procedure sync_category_listings_count();

-- ---------------------------------------------------------------------------
-- RPC FUNCTIONS
-- ---------------------------------------------------------------------------
create or replace function increment_listing_views(listing_id uuid)
returns void language sql security definer as $$
  update listings set views_count = views_count + 1 where id = listing_id;
$$;

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
alter table categories enable row level security;

drop policy if exists "categories: public read" on categories;
create policy "categories: public read"
  on categories for select using (true);

alter table profiles enable row level security;

drop policy if exists "profiles: public read"   on profiles;
drop policy if exists "profiles: owner insert"  on profiles;
drop policy if exists "profiles: owner update"  on profiles;

create policy "profiles: public read"
  on profiles for select using (true);

create policy "profiles: owner insert"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table listings enable row level security;

drop policy if exists "listings: public read active" on listings;
drop policy if exists "listings: owner read all"     on listings;
drop policy if exists "listings: owner insert"       on listings;
drop policy if exists "listings: owner update"       on listings;
drop policy if exists "listings: owner delete"       on listings;

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
