-- =============================================================================
-- ZimConnect — Add new categories + update sort order (idempotent)
-- =============================================================================

-- New categories
insert into public.categories (name, slug, icon_url, sort_order) values
  ('Baby & Kids',       'baby-kids',       '👶', 5),
  ('Kitchen & Dining',  'kitchen-dining',  '🍳', 6),
  ('Health & Beauty',   'health-beauty',   '💄', 8),
  ('Books & Education', 'books-education', '📚', 13)
on conflict (slug) do nothing;

-- Update sort orders for existing categories to match new ordering
update public.categories set sort_order = 7  where slug = 'home-garden';
update public.categories set sort_order = 9  where slug = 'agriculture';
update public.categories set sort_order = 10 where slug = 'sports';
update public.categories set sort_order = 11 where slug = 'jobs';
update public.categories set sort_order = 12 where slug = 'services';
update public.categories set sort_order = 14 where slug = 'other';

-- Update icon for services to reflect open service listings
update public.categories set icon_url = '🛠️' where slug = 'services';
