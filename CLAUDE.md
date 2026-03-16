# ZimConnect — Claude Code Project Memory

## Project Overview
ZimConnect is a marketplace web application for Zimbabwe. Users can buy and sell products and services through a clean, fast, and scalable platform.

**Core marketplace loop:**
1. User signs up → creates a profile
2. User creates a listing with images and contact info
3. Buyer browses or searches listings
4. Buyer opens listing details
5. Buyer contacts seller via WhatsApp or phone
6. Seller manages listings from dashboard

---

## Technology Stack

### Frontend
- **Next.js 14+** — App Router (not Pages Router)
- **React 18**
- **TypeScript** — strict mode always (`"strict": true` in tsconfig)
- **Tailwind CSS** — utility classes only, no custom CSS files unless necessary

### Backend / Infrastructure
- **Supabase** — PostgreSQL + Auth + Storage
- **Row Level Security (RLS)** — must be enabled on every table
- **Supabase SSR** — use `@supabase/ssr` package, never `@supabase/auth-helpers-nextjs`

### Tooling
- **Git + GitHub**
- **npm** (not yarn, not pnpm)
- **ESLint + Prettier**
- **VS Code**

---

## Repository Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Homepage
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── category/[slug]/page.tsx
│   │   ├── listing/[slug]/page.tsx
│   │   ├── search/page.tsx
│   │   └── profile/[username]/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── sell/page.tsx
│   │   ├── listings/[id]/edit/page.tsx
│   │   ├── settings/page.tsx
│   │   └── admin/page.tsx              # Phase 2
│   ├── layout.tsx                      # Root layout
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── Footer.tsx
│   │   └── Container.tsx
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── FeaturedCategories.tsx
│   │   ├── FeaturedListings.tsx
│   │   ├── HowItWorks.tsx
│   │   └── CTASection.tsx
│   ├── listings/
│   │   ├── ListingCard.tsx
│   │   ├── ListingGrid.tsx
│   │   ├── ListingGallery.tsx
│   │   ├── ListingDetails.tsx
│   │   ├── ListingMeta.tsx
│   │   └── SellerContactCard.tsx
│   ├── forms/
│   │   ├── SignupForm.tsx
│   │   ├── LoginForm.tsx
│   │   ├── ListingForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── SearchForm.tsx
│   ├── dashboard/
│   │   ├── ListingsTable.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── EmptyState.tsx
│   ├── category/
│   │   ├── CategoryCard.tsx
│   │   └── CategoryGrid.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       └── Toast.tsx
├── lib/
│   ├── supabase/
│   │   ├── browser.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── auth/
│   │   └── helpers.ts
│   ├── queries/
│   │   ├── listings.ts
│   │   ├── categories.ts
│   │   ├── profiles.ts
│   │   └── search.ts
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── listings.ts
│   │   └── profile.ts
│   ├── validations/
│   │   ├── listing.ts
│   │   └── auth.ts
│   ├── utils/
│   │   ├── contact.ts
│   │   ├── slug.ts
│   │   └── format.ts
│   ├── constants/
│   │   └── categories.ts
│   └── config.ts
├── types/
│   ├── listing.ts
│   ├── profile.ts
│   ├── category.ts
│   ├── auth.ts
│   └── index.ts
└── middleware.ts
```

---

## Environment Variables

```bash
# Public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server only (never expose to client, never in NEXT_PUBLIC_*)
SUPABASE_SERVICE_ROLE_KEY=
```

**Rule:** Never use `SUPABASE_SERVICE_ROLE_KEY` in client components or any file that could be bundled client-side.

---

## Database Schema

### `profiles` table
```sql
id            uuid PRIMARY KEY REFERENCES auth.users(id)
username      text UNIQUE NOT NULL
phone         text
location      text
avatar_url    text
created_at    timestamptz DEFAULT now()
role          text DEFAULT 'user' CHECK (role IN ('user', 'admin'))
is_suspended  boolean DEFAULT false
```

### `categories` table
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
slug        text UNIQUE NOT NULL
icon_url    text
sort_order  int DEFAULT 0
```

### `listings` table
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE
category_id    uuid REFERENCES categories(id)
title          text NOT NULL
description    text
price          numeric(10,2)
location       text
status         text DEFAULT 'active' CHECK (status IN ('active','inactive','sold','removed'))
slug           text UNIQUE
search_vector  tsvector GENERATED ALWAYS AS (
                 to_tsvector('english', title || ' ' || coalesce(description,''))
               ) STORED
created_at     timestamptz DEFAULT now()
updated_at     timestamptz DEFAULT now()
```

### `listing_images` table
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
listing_id    uuid REFERENCES listings(id) ON DELETE CASCADE
storage_path  text NOT NULL
sort_order    int DEFAULT 0
is_primary    boolean DEFAULT false
```

### Required Indexes
```sql
CREATE INDEX listings_search_idx ON listings USING GIN (search_vector);
CREATE INDEX listings_user_id_idx ON listings(user_id);
CREATE INDEX listings_category_id_idx ON listings(category_id);
CREATE INDEX listings_status_idx ON listings(status);
```

### RLS Policies
```sql
-- listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON listings FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON listings FOR DELETE USING (auth.uid() = user_id);

-- listing_images (via listing ownership)
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read images" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Owner insert images" ON listing_images FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM listings WHERE id = listing_id));
CREATE POLICY "Owner delete images" ON listing_images FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM listings WHERE id = listing_id));

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Owner update profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

---

## Routing & Middleware Rules

### Public routes (no auth required)
- `/` — homepage
- `/login` — login
- `/signup` — signup
- `/category/[slug]` — browse by category
- `/listing/[slug]` — listing detail
- `/search` — search results
- `/profile/[username]` — public seller profile

### Protected routes (redirect to `/login` if unauthenticated)
- `/dashboard`
- `/sell`
- `/listings/[id]/edit`
- `/settings`
- `/admin` — also requires `role = 'admin'`, else 404

---

## Core Coding Rules

### General
1. **TypeScript strict mode everywhere** — no `any`, no `@ts-ignore` without explanation
2. **Server components by default** — only add `'use client'` when component needs state, effects, or browser APIs
3. **Server Actions for all mutations** — no API route handlers unless absolutely necessary
4. **Zod for all validation** — validate on server, pass errors back to client
5. **Never use raw `<img>` tags** — always use `next/image`
6. **Never use unbounded SELECT queries** — always paginate with `.range(from, to)`

### Supabase Client Usage
- **Browser client** (`src/lib/supabase/browser.ts`) → use in Client Components
- **Server client** (`src/lib/supabase/server.ts`) → use in Server Components, Server Actions, Route Handlers
- **Middleware client** (`src/lib/supabase/middleware.ts`) → use only in `src/middleware.ts`

### Error Handling
- Every API/Supabase call must handle the `error` return
- All API routes return `{ error: string, status: number }` shape on failure
- App-level `error.tsx` catches unexpected errors
- `not-found.tsx` handles 404s with back-to-home navigation

### Styling
- Tailwind CSS only — no inline styles, no CSS modules unless forced
- Brand primary color: `#1A7A4A` (green)
- Mobile-first responsive design
- Use `Container` component for max-width wrapping: `max-w-7xl mx-auto px-4`

### Image Uploads (Supabase Storage)
- Bucket: `listing-images` (public read, authenticated write)
- Max: 6 images per listing, 5MB per image
- Types: `image/jpeg`, `image/png`, `image/webp`
- Path: `{user_id}/{listing_id}/{uuid}.{ext}`

### WhatsApp Links (Zimbabwe)
- Format: `https://wa.me/263{number}?text={encodedMessage}`
- Strip leading `0` from local number: `0771234567` → `263771234567`
- Use `formatWhatsAppLink()` from `src/lib/utils/contact.ts`

### Search
- Use PostgreSQL full-text search via `search_vector` tsvector column
- Never use `ilike` for search — use `to_tsquery`
- Sanitize query input before passing to `to_tsquery`

---

## Git Conventions

### Branch Naming
```
feature/{feature-name}    e.g. feature/listing-form
fix/{issue}               e.g. fix/image-upload-error
chore/{task}              e.g. chore/update-dependencies
docs/{topic}              e.g. docs/update-readme
```

### Commit Prefixes
```
feat:      new feature
fix:       bug fix
chore:     non-code task (deps, config)
docs:      documentation
refactor:  code restructure without feature change
test:      adding or updating tests
```

---

## Build Order

Follow this sequence to avoid dependency issues:

1. Project setup + folder structure
2. Supabase client helpers + `middleware.ts`
3. Database schema + RLS in Supabase dashboard
4. Authentication (signup, login, logout)
5. Navbar + Footer + root layout
6. Category system + constants
7. Homepage (needs categories + recent listings)
8. Listing creation + image upload
9. Listing detail page
10. Category browse page
11. Search page
12. Seller dashboard + listing management
13. User profile + settings
14. Admin moderation (Phase 2)

---

## Common Patterns

### Server Component with data fetch
```tsx
// Always handle errors, never throw bare
export default async function Page() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('listings').select('*')
  if (error) return <div>Failed to load listings</div>
  return <ListingGrid listings={data} />
}
```

### Server Action pattern
```ts
'use server'
export async function createListing(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  // validate with zod, then insert
}
```

### Pagination pattern
```ts
const PAGE_SIZE = 12
const from = (page - 1) * PAGE_SIZE
const to = from + PAGE_SIZE - 1
const { data } = await supabase
  .from('listings')
  .select('*')
  .range(from, to)
```
