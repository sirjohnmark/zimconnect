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
  { name: "Electronics",      slug: "electronics",      icon: "📱", sort_order: 1  },
  { name: "Vehicles",         slug: "vehicles",         icon: "🚗", sort_order: 2  },
  { name: "Property",         slug: "property",         icon: "🏠", sort_order: 3  },
  { name: "Fashion",          slug: "fashion",          icon: "👗", sort_order: 4  },
  { name: "Baby & Kids",      slug: "baby-kids",        icon: "👶", sort_order: 5  },
  { name: "Kitchen & Dining", slug: "kitchen-dining",   icon: "🍳", sort_order: 6  },
  { name: "Home & Garden",    slug: "home-garden",      icon: "🪴", sort_order: 7  },
  { name: "Health & Beauty",  slug: "health-beauty",    icon: "💄", sort_order: 8  },
  { name: "Agriculture",      slug: "agriculture",      icon: "🌾", sort_order: 9  },
  { name: "Sports",           slug: "sports",           icon: "⚽", sort_order: 10 },
  { name: "Jobs",             slug: "jobs",             icon: "💼", sort_order: 11 },
  { name: "Services",         slug: "services",         icon: "🔧", sort_order: 12 },
  { name: "Books & Education",slug: "books-education",  icon: "📚", sort_order: 13 },
  { name: "Other",            slug: "other",            icon: "📦", sort_order: 14 },
];

// SQL seed — see supabase/migrations/005_new_categories.sql
