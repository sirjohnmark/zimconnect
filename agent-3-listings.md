# Agent 3 — Listings & Marketplace

## Identity
You are the **Listings & Marketplace Agent** for ZimConnect. You own the core product
experience: creating listings, browsing by category, viewing listing details, image upload,
and the homepage. This is the heart of the marketplace.

Read `CLAUDE.md` fully before writing a single line of code.
Confirm Agents 1 and 2 have completed and `npm run build` passes before starting.

---

## Prerequisites

Before starting, verify these exist (created by Agent 1 & 2):
- `src/lib/supabase/browser.ts` and `src/lib/supabase/server.ts`
- `src/types/listing.ts` — `Listing`, `ListingWithSeller`, `ListingImage`, `ListingStatus`
- `src/types/category.ts` — `Category`
- `src/types/profile.ts` — `Profile`
- `src/lib/auth/helpers.ts` — `requireUser()`
- `src/lib/utils/contact.ts` — `formatWhatsAppLink()`
- `src/lib/utils/slug.ts` — `generateSlug()`
- `src/lib/utils/format.ts` — `formatPrice()`, `formatDate()`, `timeAgo()`
- `src/lib/constants/categories.ts` — static category list
- `src/components/ui/` — Button, Input, Badge, Skeleton

---

## Scope

You are responsible for:

### Queries
- `src/lib/queries/listings.ts` — getListings, getListingBySlug, getListingsByUser, getFeaturedListings
- `src/lib/queries/categories.ts` — getAllCategories, getCategoryBySlug

### Server Actions
- `src/lib/actions/listings.ts` — createListing (with image upload)

### Validations
- `src/lib/validations/listing.ts` — Zod schema for listing creation

### Components — Listings
- `src/components/listings/ListingCard.tsx`
- `src/components/listings/ListingGrid.tsx`
- `src/components/listings/ListingGallery.tsx`
- `src/components/listings/ListingDetails.tsx`
- `src/components/listings/ListingMeta.tsx`
- `src/components/listings/SellerContactCard.tsx`

### Components — Category
- `src/components/category/CategoryCard.tsx`
- `src/components/category/CategoryGrid.tsx`

### Components — Forms
- `src/components/forms/ListingForm.tsx`

### Components — Home
- `src/components/home/Hero.tsx`
- `src/components/home/FeaturedCategories.tsx`
- `src/components/home/FeaturedListings.tsx`
- `src/components/home/HowItWorks.tsx`
- `src/components/home/CTASection.tsx`

### Pages
- `src/app/(public)/page.tsx` — homepage
- `src/app/(public)/category/[slug]/page.tsx`
- `src/app/(public)/listing/[slug]/page.tsx`
- `src/app/(dashboard)/sell/page.tsx`

---

## What You Must NOT Do
- Do not modify auth files (Agent 2's scope)
- Do not build the dashboard listing management table (Agent 4's scope)
- Do not build search (Agent 4's scope)
- Do not create Supabase clients inline — import from `src/lib/supabase/`

---

## Detailed Instructions

### 1. Listing Validation

**`src/lib/validations/listing.ts`**
```typescript
import { z } from 'zod'

export const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description too long'),
  price: z
    .string()
    .refine(val => val === '' || !isNaN(parseFloat(val)), 'Price must be a valid number')
    .transform(val => val === '' ? null : parseFloat(val))
    .refine(val => val === null || val >= 0, 'Price cannot be negative'),
  category_id: z.string().uuid('Please select a category'),
  location: z.string().min(2, 'Location is required').max(100),
})

export type CreateListingInput = z.infer<typeof createListingSchema>
```

### 2. Category Queries

**`src/lib/queries/categories.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import { STATIC_CATEGORIES } from '@/lib/constants/categories'
import type { Category } from '@/types'

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error || !data?.length) {
    // Fallback to static list if DB unavailable or empty
    return STATIC_CATEGORIES.map((c, i) => ({ ...c, id: String(i) }))
  }
  return data as Category[]
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as Category
}
```

### 3. Listing Queries

**`src/lib/queries/listings.ts`**

The PAGE_SIZE is 12 — never change this without updating pagination UI.

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Listing, ListingWithSeller } from '@/types'

const PAGE_SIZE = 12

const LISTING_WITH_IMAGES = `
  *,
  images:listing_images(*),
  seller:profiles(id, username, phone, location, avatar_url)
`

export async function getListingBySlug(slug: string): Promise<ListingWithSeller | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_WITH_IMAGES)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error) return null
  return data as unknown as ListingWithSeller
}

export async function getListingsByCategory(
  categoryId: string,
  page = 1
): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('listings')
    .select('*, images:listing_images(*)', { count: 'exact' })
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { listings: [], total: 0 }
  return { listings: data as Listing[], total: count ?? 0 }
}

export async function getFeaturedListings(limit = 8): Promise<Listing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*, images:listing_images(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data as Listing[]
}

export async function getListingsByUser(
  userId: string,
  page = 1
): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('listings')
    .select('*, images:listing_images(*)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { listings: [], total: 0 }
  return { listings: data as Listing[], total: count ?? 0 }
}

export async function getListingById(id: string): Promise<Listing | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*, images:listing_images(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Listing
}
```

### 4. Listing Creation Action

**`src/lib/actions/listings.ts`**

Critical rules for image upload:
- Validate file count (max 6) and size (max 5MB) BEFORE uploading
- Validate file type (jpeg/png/webp only)
- Upload to `listing-images` bucket with path `{user_id}/{listing_id}/{uuid}.{ext}`
- Insert all `listing_images` rows after upload
- Mark `is_primary = true` for the first image
- If listing insert fails, do NOT attempt image upload
- If image upload fails, still return the listing (partial success — log the error)

```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server'
import { createListingSchema } from '@/lib/validations/listing'
import { generateSlug } from '@/lib/utils/slug'
import { requireUser } from '@/lib/auth/helpers'
import type { ActionResult } from '@/types'

const MAX_IMAGES = 6
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function createListing(formData: FormData): Promise<ActionResult<{ slug: string }>> {
  const user = await requireUser()
  const supabase = await createClient()

  // 1. Validate fields
  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: formData.get('price') as string,
    category_id: formData.get('category_id') as string,
    location: formData.get('location') as string,
  }

  const parsed = createListingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // 2. Validate images
  const imageFiles = formData.getAll('images') as File[]
  const validImages = imageFiles.filter(f => f.size > 0)

  if (validImages.length > MAX_IMAGES) {
    return { error: `Maximum ${MAX_IMAGES} images allowed` }
  }

  for (const file of validImages) {
    if (file.size > MAX_FILE_SIZE) {
      return { error: `Image "${file.name}" exceeds 5MB limit` }
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: `"${file.name}" is not a supported image format (use JPEG, PNG, or WebP)` }
    }
  }

  // 3. Insert listing
  const slug = generateSlug(parsed.data.title)
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert({
      user_id: user.id,
      category_id: parsed.data.category_id,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      location: parsed.data.location,
      slug,
      status: 'active',
    })
    .select()
    .single()

  if (listingError) {
    return { error: 'Failed to create listing. Please try again.' }
  }

  // 4. Upload images
  if (validImages.length > 0) {
    const imageInserts = []

    for (let i = 0; i < validImages.length; i++) {
      const file = validImages[i]
      const ext = file.name.split('.').pop() ?? 'jpg'
      const fileName = `${uuidv4()}.${ext}`
      const storagePath = `${user.id}/${listing.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(storagePath, file)

      if (!uploadError) {
        imageInserts.push({
          listing_id: listing.id,
          storage_path: storagePath,
          sort_order: i,
          is_primary: i === 0,
        })
      }
    }

    if (imageInserts.length > 0) {
      await supabase.from('listing_images').insert(imageInserts)
    }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  redirect(`/listing/${slug}`)
}
```

### 5. Listing Components

**`src/components/listings/ListingCard.tsx`** — Server or Client Component

Displays:
- Primary image (next/image, aspect-ratio 4:3, object-cover)
- Title (truncated to 2 lines)
- Price (formatted via `formatPrice()`)
- Location + timeAgo()
- Status badge
- Links to `/listing/[slug]`

**`src/components/listings/ListingGrid.tsx`**

Props: `listings: Listing[]`, `emptyMessage?: string`
- Responsive grid: 1 col mobile, 2 col tablet, 3-4 col desktop
- Shows empty state with message if no listings

**`src/components/listings/ListingGallery.tsx`** — `'use client'`

Props: `images: ListingImage[]`, `title: string`
- Large primary image display (next/image, fill, object-contain)
- Thumbnail strip below (max 6)
- Click thumbnail → update main image (useState)
- If no images: show a placeholder with camera icon

**`src/components/listings/ListingDetails.tsx`**

Props: `listing: ListingWithSeller`
- Title (h1)
- Price (large, formatted)
- Description (with whitespace-pre-wrap for line breaks)
- Location with map pin icon
- Posted date (`timeAgo()`)
- Category badge

**`src/components/listings/ListingMeta.tsx`**

Props: `listing: Listing`
- Small metadata row: category, location, status
- Displayed as labeled chips

**`src/components/listings/SellerContactCard.tsx`**

Props: `seller: Profile`
- Seller name and location
- WhatsApp button — opens `formatWhatsAppLink(phone, 'Hi, I'm interested in your listing on ZimConnect')`
- Phone reveal button — shows number after click (useState, `'use client'`)
- If no phone, hide contact buttons and show "Contact not provided"

### 6. Category Components

**`src/components/category/CategoryCard.tsx`**
- Shows icon (or emoji fallback), category name
- Links to `/category/[slug]`
- Hover effect with brand green accent

**`src/components/category/CategoryGrid.tsx`**
- Props: `categories: Category[]`
- Responsive grid of CategoryCards

### 7. Home Components

**`src/components/home/Hero.tsx`**
- Headline: "Buy and Sell Anything in Zimbabwe"
- Subheading: "Find great deals or reach thousands of buyers — ZimConnect makes it easy."
- CTA buttons: "Browse Listings" → `/search`, "Start Selling" → `/sell`
- Background: brand green gradient or a subtle pattern
- Mobile responsive

**`src/components/home/FeaturedCategories.tsx`**
- Server Component
- Fetches top 8 categories from DB
- Renders CategoryGrid
- Section heading: "Browse by Category"

**`src/components/home/FeaturedListings.tsx`**
- Server Component
- Fetches 8 most recent active listings via `getFeaturedListings(8)`
- Renders ListingGrid
- Section heading: "Latest Listings"

**`src/components/home/HowItWorks.tsx`**
- Static 3-step section
- Steps: "Post a Listing" → "Get Contacted" → "Close the Deal"
- Icon for each step
- Clean, centered layout

**`src/components/home/CTASection.tsx`**
- Bottom banner: "Ready to sell? It's free and takes 2 minutes."
- CTA button: "Post a Listing" → `/sell`
- Brand green background

### 8. Listing Form

**`src/components/forms/ListingForm.tsx`** — `'use client'`

Fields:
- Title (text input)
- Description (textarea, min 20 chars)
- Price (number input, optional — show "0 = free" hint)
- Category (select dropdown — fetched from props)
- Location (text input)
- Images (file input, multiple, accept="image/jpeg,image/png,image/webp")
  - Shows thumbnail previews using `URL.createObjectURL()`
  - Shows per-image remove button
  - Shows count "3/6 images"
  - Validates size + type on client side before submit
- Submit button with loading state

Props: `categories: Category[]`

The form uses `action={createListing}` with `useTransition` for pending UI.

### 9. Pages

**`src/app/(public)/page.tsx`**
```typescript
// Server Component — assembles homepage sections
import { Hero } from '@/components/home/Hero'
import { FeaturedCategories } from '@/components/home/FeaturedCategories'
import { FeaturedListings } from '@/components/home/FeaturedListings'
import { HowItWorks } from '@/components/home/HowItWorks'
import { CTASection } from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <FeaturedListings />
      <HowItWorks />
      <CTASection />
    </>
  )
}
```

**`src/app/(public)/category/[slug]/page.tsx`**
- Server Component
- Fetch category by slug — if not found, `notFound()`
- Read `page` from `searchParams` (default 1)
- Fetch listings by category with pagination
- Show: category heading, listing count, ListingGrid, pagination controls
- Add `generateMetadata` for SEO
- Use Suspense + Skeleton for loading state

**`src/app/(public)/listing/[slug]/page.tsx`**
- Server Component
- Fetch listing by slug — if not found, `notFound()`
- Show: ListingGallery (left), ListingDetails + SellerContactCard (right) on desktop
- Single column on mobile
- Add `generateMetadata` for SEO: title = `{listing.title} — ZimConnect`
- Related listings section (optional): same category, limit 4

**`src/app/(dashboard)/sell/page.tsx`**
- Server Component
- Call `requireUser()` — redirect to login if not authenticated
- Fetch all categories for the form dropdown
- Render ListingForm with categories
- On successful listing creation, the action redirects to the listing detail page

---

## Image URL Helper

To display images from Supabase Storage, use this pattern:
```typescript
// In a component
const supabase = createClient() // browser client
const { data } = supabase.storage
  .from('listing-images')
  .getPublicUrl(storagePath)
// data.publicUrl is the full URL
```

Or create a helper in `src/lib/utils/storage.ts`:
```typescript
export function getListingImageUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${storagePath}`
}
```

---

## Acceptance Criteria

Before handing off to Agent 4:

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run lint` passes
- [ ] Homepage loads with categories and recent listings from DB
- [ ] `/category/[slug]` shows correct listings for that category, paginated
- [ ] `/listing/[slug]` shows full listing detail with images, seller contact
- [ ] WhatsApp link format is correct: `https://wa.me/263{number}?text=...`
- [ ] `/sell` page is protected — unauthenticated users redirected to `/login`
- [ ] Creating a listing with images works — images appear on listing detail page
- [ ] Creating a listing without images works — placeholder shown
- [ ] Max 6 images enforced client-side and server-side
- [ ] 5MB image size limit enforced
- [ ] All images use `next/image` — no raw `<img>` tags
- [ ] ListingGrid shows empty state when no listings

---

## Handoff Notes
<!-- Agent 3 fills this in upon completion -->

**Status:** [ ] Complete
**Build:** [ ] Passing
**Lint:** [ ] Passing
**Notes:**
**Deferred items for Agent 4:**
