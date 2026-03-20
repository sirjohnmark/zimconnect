-- =============================================================================
-- ZimConnect — Category Browse History (idempotent)
-- Tracks which categories each user has visited so the dashboard can surface
-- personalised "based on your browsing" listing recommendations.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. category_views table
-- ---------------------------------------------------------------------------
create table if not exists public.category_views (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles(id)   on delete cascade,
  category_id   uuid        not null references public.categories(id) on delete cascade,
  view_count    integer     not null default 1,
  last_viewed_at timestamptz not null default now(),
  constraint category_views_unique unique (user_id, category_id)
);

-- Fast lookup ordered by recency per user (used by getListingsInBrowsedCategories)
create index if not exists idx_category_views_user_recent
  on public.category_views(user_id, last_viewed_at desc);

-- ---------------------------------------------------------------------------
-- 2. RLS — users can only see and update their own rows
-- ---------------------------------------------------------------------------
alter table public.category_views enable row level security;

drop policy if exists "category_views: owner select" on public.category_views;
drop policy if exists "category_views: owner upsert" on public.category_views;
drop policy if exists "category_views: owner delete" on public.category_views;

-- A user can only read their own browse history.
create policy "category_views: owner select"
  on public.category_views for select
  using (auth.uid() = user_id);

-- Upserts are allowed only for the authenticated user's own row.
create policy "category_views: owner upsert"
  on public.category_views for insert
  with check (auth.uid() = user_id);

-- Increments go through UPDATE — also owner-only.
create policy "category_views: owner update"
  on public.category_views for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Cleanup if a user deletes their account cascade handles it, but allow
-- explicit deletion too.
create policy "category_views: owner delete"
  on public.category_views for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. RPC — upsert_category_view
-- Increments view_count and refreshes last_viewed_at atomically.
-- Called from the recordCategoryView server action via supabase.rpc().
-- SECURITY DEFINER so the function runs with elevated privileges and the
-- RLS check (auth.uid() = user_id) inside the VALUES clause is enough.
-- ---------------------------------------------------------------------------
create or replace function public.upsert_category_view(
  p_user_id     uuid,
  p_category_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.category_views (user_id, category_id, view_count, last_viewed_at)
  values (p_user_id, p_category_id, 1, now())
  on conflict (user_id, category_id) do update
    set view_count     = category_views.view_count + 1,
        last_viewed_at = now();
$$;
