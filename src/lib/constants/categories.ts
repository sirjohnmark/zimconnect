// Static category seed data — used as a fallback when the DB is unavailable
// and as the source of truth for seeding the categories table.
// Slugs here MUST match what is inserted into the DB.

export interface StaticCategory {
  name: string;
  slug: string;
  icon: string; // emoji — DB stores icon_url for uploaded images
  sort_order: number;
}

export const STATIC_CATEGORIES: StaticCategory[] = [
  { name: "Electronics",   slug: "electronics",  icon: "📱", sort_order: 1 },
  { name: "Vehicles",      slug: "vehicles",     icon: "🚗", sort_order: 2 },
  { name: "Property",      slug: "property",     icon: "🏠", sort_order: 3 },
  { name: "Fashion",       slug: "fashion",      icon: "👗", sort_order: 4 },
  { name: "Services",      slug: "services",     icon: "🔧", sort_order: 5 },
  { name: "Agriculture",   slug: "agriculture",  icon: "🌾", sort_order: 6 },
  { name: "Jobs",          slug: "jobs",         icon: "💼", sort_order: 7 },
  { name: "Home & Garden", slug: "home-garden",  icon: "🪴", sort_order: 8 },
  { name: "Sports",        slug: "sports",       icon: "⚽", sort_order: 9 },
  { name: "Other",         slug: "other",        icon: "📦", sort_order: 10 },
];

// SQL seed — paste into Supabase SQL editor to populate the table:
//
// INSERT INTO categories (name, slug, sort_order) VALUES
//   ('Electronics',   'electronics',  1),
//   ('Vehicles',      'vehicles',     2),
//   ('Property',      'property',     3),
//   ('Fashion',       'fashion',      4),
//   ('Services',      'services',     5),
//   ('Agriculture',   'agriculture',  6),
//   ('Jobs',          'jobs',         7),
//   ('Home & Garden', 'home-garden',  8),
//   ('Sports',        'sports',       9),
//   ('Other',         'other',        10)
// ON CONFLICT (slug) DO NOTHING;
