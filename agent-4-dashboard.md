# Agent 4 — Dashboard, Search & Admin

## Identity
You are the **Dashboard, Search & Admin Agent** for ZimConnect. You build the seller tools
(listing management, edit, delete), the search system, and the Phase 2 admin moderation panel.

Read `CLAUDE.md` fully before writing a single line of code.
Confirm Agents 1, 2, and 3 have completed and `npm run build` passes before starting.

---

## Prerequisites

Before starting, verify these exist (created by prior agents):
- `src/lib/supabase/server.ts` — `createClient()`
- `src/lib/auth/helpers.ts` — `requireUser()`, `getCurrentProfile()`
- `src/lib/queries/listings.ts` — `getListingsByUser()`, `getListingById()`
- `src/lib/actions/listings.ts` — `createListing()`
- `src/types/listing.ts` — all types
- `src/components/listings/ListingGrid.tsx` — for showing listing results
- `src/components/forms/ListingForm.tsx` — for the edit form (you will extend this)
- `src/components/ui/` — all base UI components

---

## Scope

You are responsible for:

### Queries (extend existing file)
- `src/lib/queries/listings.ts` — add: `getListingsByUser()` already done by Agent 3; verify it exists
- `src/lib/queries/search.ts` — full-text search query
- `src/lib/queries/admin.ts` — (Phase 2) getAllListings, getAllUsers

### Server Actions (extend existing file)
- `src/lib/actions/listings.ts` — add: `updateListing()`, `deleteListing()`
- `src/lib/actions/admin.ts` — (Phase 2) `moderateListing()`, `suspendUser()`

### Form Components
- `src/components/forms/SearchForm.tsx`
- Extend `ListingForm.tsx` to support edit mode (pre-populated fields)

### Dashboard Components
- `src/components/dashboard/DashboardHeader.tsx`
- `src/components/dashboard/ListingsTable.tsx`
- `src/components/dashboard/EmptyState.tsx`

### Pages
- `src/app/(public)/search/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/listings/[id]/edit/page.tsx`
- `src/app/(dashboard)/admin/page.tsx` — Phase 2

---

## What You Must NOT Do
- Do not re-create Supabase clients — import from `src/lib/supabase/`
- Do not modify auth files (Agent 2) unless fixing a bug
- Do not modify listing creation logic (Agent 3) — only extend
- Do not use `ilike` for search — use full-text search only

---

## Detailed Instructions

### 1. Update & Delete Listing Actions

**Extend `src/lib/actions/listings.ts`**

Add these two actions to the existing file:

```typescript
export async function updateListing(
  id: string,
  formData: FormData
): Promise<ActionResult<{ slug: string }>> {
  const user = await requireUser()
  const supabase = await createClient()

  // Ownership check
  const { data: existing, error: fetchError } = await supabase
    .from('listings')
    .select('user_id, slug')
    .eq('id', id)
    .single()

  if (fetchError || !existing) return { error: 'Listing not found' }
  if (existing.user_id !== user.id) return { error: 'Unauthorized' }

  // Validate fields
  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: formData.get('price') as string,
    category_id: formData.get('category_id') as string,
    location: formData.get('location') as string,
  }

  const parsed = createListingSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error: updateError } = await supabase
    .from('listings')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      category_id: parsed.data.category_id,
      location: parsed.data.location,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) return { error: 'Failed to update listing' }

  // Handle new image uploads if provided
  const newImages = (formData.getAll('images') as File[]).filter(f => f.size > 0)
  if (newImages.length > 0) {
    const imageInserts = []
    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i]
      if (file.size > 5 * 1024 * 1024) continue
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue

      const ext = file.name.split('.').pop() ?? 'jpg'
      const storagePath = `${user.id}/${id}/${uuidv4()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(storagePath, file)

      if (!uploadError) {
        imageInserts.push({ listing_id: id, storage_path: storagePath, sort_order: i, is_primary: false })
      }
    }
    if (imageInserts.length > 0) {
      await supabase.from('listing_images').insert(imageInserts)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/listing/${existing.slug}`)
  return { data: { slug: existing.slug } }
}

export async function deleteListing(id: string): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()

  // Ownership check
  const { data: existing, error: fetchError } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) return { error: 'Listing not found' }
  if (existing.user_id !== user.id) return { error: 'Unauthorized' }

  // Delete images from storage first
  const { data: images } = await supabase
    .from('listing_images')
    .select('storage_path')
    .eq('listing_id', id)

  if (images && images.length > 0) {
    const paths = images.map(img => img.storage_path)
    await supabase.storage.from('listing-images').remove(paths)
  }

  // Delete listing (cascade will delete listing_images rows)
  const { error: deleteError } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)

  if (deleteError) return { error: 'Failed to delete listing' }

  revalidatePath('/dashboard')
  revalidatePath('/')
  return {}
}

export async function updateListingStatus(
  id: string,
  status: ListingStatus
): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user.id) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: 'Failed to update status' }

  revalidatePath('/dashboard')
  return {}
}
```

### 2. Search Query

**`src/lib/queries/search.ts`**

Use full-text search only. Never use `ilike`.

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/types'

const PAGE_SIZE = 12

/**
 * Sanitize a user-provided search query for to_tsquery.
 * Removes characters that break tsquery syntax.
 */
function sanitizeQuery(query: string): string {
  return query
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' & ')
}

export async function searchListings(
  query: string,
  page = 1
): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Empty query → return recent listings
  if (!query.trim()) {
    const { data, error, count } = await supabase
      .from('listings')
      .select('*, images:listing_images(*)', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return { listings: [], total: 0 }
    return { listings: data as Listing[], total: count ?? 0 }
  }

  const sanitized = sanitizeQuery(query)
  if (!sanitized) return { listings: [], total: 0 }

  const { data, error, count } = await supabase
    .from('listings')
    .select('*, images:listing_images(*)', { count: 'exact' })
    .eq('status', 'active')
    .textSearch('search_vector', sanitized, { type: 'websearch' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { listings: [], total: 0 }
  return { listings: data as Listing[], total: count ?? 0 }
}
```

### 3. Search Form Component

**`src/components/forms/SearchForm.tsx`**

This is a Server Component (uses GET, not POST).

```tsx
// Server Component — no 'use client'
export function SearchForm({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form method="GET" action="/search" className="flex gap-2 w-full max-w-xl">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search listings..."
        className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7A4A]"
      />
      <button
        type="submit"
        className="bg-[#1A7A4A] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#155e38] transition"
      >
        Search
      </button>
    </form>
  )
}
```

### 4. Dashboard Components

**`src/components/dashboard/EmptyState.tsx`**
- Props: `title`, `description`, `actionLabel`, `actionHref`
- Shows an icon, title, description, and a CTA button

**`src/components/dashboard/DashboardHeader.tsx`**
- Props: `username: string`, `listingCount: number`
- Shows "Welcome back, {username}" heading
- Shows total listing count badge
- Shows "Post a Listing" button → `/sell`

**`src/components/dashboard/ListingsTable.tsx`** — `'use client'`

Props: `listings: Listing[]`, `onDelete: (id: string) => void`, `onStatusChange: (id: string, status: ListingStatus) => void`

Columns:
- Thumbnail (40×40, next/image)
- Title (truncated, links to `/listing/[slug]`)
- Category (badge)
- Price (formatted)
- Status (dropdown to change: active/inactive/sold)
- Actions: Edit (→ `/listings/[id]/edit`), Delete (confirm dialog)

Mobile: shows condensed card view instead of table

Delete flow:
- Click delete → show inline confirmation "Are you sure? This cannot be undone."
- Two buttons: "Cancel" and "Delete" (red)
- On confirm → call delete action → remove row from UI

### 5. Dashboard Page

**`src/app/(dashboard)/dashboard/page.tsx`**

Server Component. Calls `requireUser()`. Fetches `getListingsByUser(user.id)`.

```typescript
import { requireUser } from '@/lib/auth/helpers'
import { getListingsByUser } from '@/lib/queries/listings'
import { getProfileById } from '@/lib/queries/profiles'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ListingsTable } from '@/components/dashboard/ListingsTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Container } from '@/components/layout/Container'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const user = await requireUser()
  const page = parseInt(searchParams.page ?? '1')
  const [profile, { listings, total }] = await Promise.all([
    getProfileById(user.id),
    getListingsByUser(user.id, page),
  ])

  return (
    <Container className="py-8">
      <DashboardHeader
        username={profile?.username ?? 'Seller'}
        listingCount={total}
      />
      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Post your first listing to start selling on ZimConnect."
          actionLabel="Post a Listing"
          actionHref="/sell"
        />
      ) : (
        <ListingsTable listings={listings} />
      )}
    </Container>
  )
}
```

### 6. Edit Listing Page

**`src/app/(dashboard)/listings/[id]/edit/page.tsx`**

Server Component.

```typescript
import { requireUser } from '@/lib/auth/helpers'
import { getListingById } from '@/lib/queries/listings'
import { getAllCategories } from '@/lib/queries/categories'
import { ListingForm } from '@/components/forms/ListingForm'
import { notFound } from 'next/navigation'

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const user = await requireUser()
  const [listing, categories] = await Promise.all([
    getListingById(params.id),
    getAllCategories(),
  ])

  if (!listing) notFound()
  if (listing.user_id !== user.id) notFound() // Security: don't reveal the listing exists

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
      <ListingForm
        categories={categories}
        mode="edit"
        listing={listing}
      />
    </div>
  )
}
```

**Update `ListingForm.tsx` to support edit mode:**

Add these props:
```typescript
interface ListingFormProps {
  categories: Category[]
  mode?: 'create' | 'edit'
  listing?: Listing  // pre-populated data for edit mode
}
```

When `mode === 'edit'`:
- Pre-populate all fields with `listing` data
- Form action calls `updateListing(listing.id, formData)`
- Show existing images with per-image delete option
- New image uploads add to existing images

### 7. Search Page

**`src/app/(public)/search/page.tsx`**

Server Component. Reads `q` from searchParams.

```typescript
import { searchListings } from '@/lib/queries/search'
import { SearchForm } from '@/components/forms/SearchForm'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { Container } from '@/components/layout/Container'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const query = searchParams.q ?? ''
  const page = parseInt(searchParams.page ?? '1')
  const { listings, total } = await searchListings(query, page)

  return (
    <Container className="py-8">
      <div className="mb-6">
        <SearchForm defaultValue={query} />
      </div>

      {query && (
        <p className="text-sm text-gray-500 mb-4">
          {total} result{total !== 1 ? 's' : ''} for "{query}"
        </p>
      )}

      <ListingGrid
        listings={listings}
        emptyMessage={
          query
            ? `No listings found for "${query}". Try different keywords.`
            : 'No listings available yet.'
        }
      />

      {/* Pagination */}
      {total > 12 && (
        <Pagination total={total} page={page} query={query} />
      )}
    </Container>
  )
}
```

Build a `Pagination` component that generates links with `?q={query}&page={n}` params.

---

## Phase 2 — Admin Moderation

**Only build these after all Phase 1 features are complete and tested.**

### Database Changes Required (run in Supabase SQL editor)
```sql
-- Add role and suspension to profiles (may already exist from schema.sql)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Admin bypass policy for listings
CREATE POLICY "Admin full access" ON listings
  USING ((auth.jwt() ->> 'role') = 'admin');
```

### Admin Queries

**`src/lib/queries/admin.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/helpers'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function getAllListingsAdmin(page = 1) {
  const supabase = await assertAdmin()
  const from = (page - 1) * 20
  const to = from + 19

  const { data, error, count } = await supabase
    .from('listings')
    .select('*, seller:profiles(username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { listings: [], total: 0 }
  return { listings: data, total: count ?? 0 }
}

export async function getAllUsersAdmin(page = 1) {
  const supabase = await assertAdmin()
  const from = (page - 1) * 20
  const to = from + 19

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { users: [], total: 0 }
  return { users: data, total: count ?? 0 }
}
```

### Admin Actions

**`src/lib/actions/admin.ts`**
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, ListingStatus } from '@/types'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return { supabase, user }
}

export async function moderateListing(
  id: string,
  status: ListingStatus
): Promise<ActionResult> {
  const admin = await assertAdmin()
  if (!admin) return { error: 'Forbidden' }

  const { error } = await admin.supabase
    .from('listings')
    .update({ status })
    .eq('id', id)

  if (error) return { error: 'Failed to update listing' }

  revalidatePath('/admin')
  revalidatePath('/')
  return {}
}

export async function suspendUser(id: string): Promise<ActionResult> {
  const admin = await assertAdmin()
  if (!admin) return { error: 'Forbidden' }

  const { error } = await admin.supabase
    .from('profiles')
    .update({ is_suspended: true })
    .eq('id', id)

  if (error) return { error: 'Failed to suspend user' }

  revalidatePath('/admin')
  return {}
}
```

### Admin Page

**`src/app/(dashboard)/admin/page.tsx`**

Server Component. Gate access in both middleware AND in the page itself (defense in depth).

```typescript
import { getCurrentProfile } from '@/lib/auth/helpers'
import { notFound } from 'next/navigation'
import { getAllListingsAdmin, getAllUsersAdmin } from '@/lib/queries/admin'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') notFound()

  const page = parseInt(searchParams.page ?? '1')
  const [{ listings, total: listingTotal }, { users, total: userTotal }] =
    await Promise.all([getAllListingsAdmin(page), getAllUsersAdmin(page)])

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          All Listings ({listingTotal})
        </h2>
        {/* Admin listings table with status change + remove controls */}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          All Users ({userTotal})
        </h2>
        {/* Admin users table with suspend controls */}
      </section>
    </div>
  )
}
```

Also update `src/middleware.ts` to protect `/admin` — redirect non-admin users to 404.

---

## Acceptance Criteria

### Phase 1
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run lint` passes
- [ ] `/dashboard` shows all user listings with edit/delete/status controls
- [ ] Deleting a listing also removes its images from Supabase Storage
- [ ] Editing a listing pre-populates all fields correctly
- [ ] Status change (active/inactive/sold) works and updates immediately
- [ ] Delete shows confirmation dialog before proceeding
- [ ] `/search?q=phone` returns listings matching "phone" using full-text search
- [ ] `/search` with empty query returns recent listings
- [ ] Searching with special characters does not break the query
- [ ] Search shows result count
- [ ] Search pagination works with `?page=2`

### Phase 2
- [ ] `/admin` is inaccessible to non-admin users (returns 404)
- [ ] Admin can change any listing status
- [ ] Admin can suspend a user
- [ ] Suspended user's listings remain visible (status management is separate)

---

## Handoff Notes
<!-- Agent 4 fills this in upon completion -->

**Status:** [ ] Complete
**Build:** [ ] Passing
**Lint:** [ ] Passing
**Phase 1:** [ ] Complete
**Phase 2:** [ ] Complete
**Notes:**
**Outstanding items:**
