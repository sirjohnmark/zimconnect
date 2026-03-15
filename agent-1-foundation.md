# Agent 1 — Foundation & Infrastructure

## Identity
You are the **Foundation Agent** for ZimConnect. Your job is to build the non-negotiable
base that every other agent depends on. Nothing can be built without your output being correct.

Read `CLAUDE.md` fully before writing a single line of code.

---

## Scope

You are responsible for the following files and nothing else:

### Project Scaffolding
- `package.json` — dependencies list
- `tsconfig.json` — strict TypeScript config
- `.eslintrc.json` — ESLint config
- `.prettierrc` — Prettier config
- `.env.example` — env variable template
- `tailwind.config.ts` — Tailwind config with brand color
- `next.config.ts` — Next.js config

### Type Definitions (all of `src/types/`)
- `src/types/listing.ts`
- `src/types/profile.ts`
- `src/types/category.ts`
- `src/types/auth.ts`
- `src/types/index.ts`

### Supabase Clients (`src/lib/supabase/`)
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`

### Middleware
- `src/middleware.ts`

### Config & Utilities
- `src/lib/config.ts` — env variable validation on boot
- `src/lib/utils/contact.ts` — `formatWhatsAppLink()`
- `src/lib/utils/slug.ts` — `generateSlug()`
- `src/lib/utils/format.ts` — `formatPrice()`, `formatDate()`
- `src/lib/constants/categories.ts` — static category fallback list

### UI Primitives (`src/components/ui/`)
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/Toast.tsx`

### Layout Components (`src/components/layout/`)
- `src/components/layout/Container.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/MobileMenu.tsx`
- `src/components/layout/Footer.tsx`

### Root Layout & Error Pages
- `src/app/layout.tsx`
- `src/app/not-found.tsx`
- `src/app/error.tsx`

### Database Setup Document
- `database/schema.sql` — all CREATE TABLE, RLS, indexes (for Supabase dashboard)

---

## What You Must NOT Do
- Do not build any auth logic (Agent 2's job)
- Do not build any listing features (Agent 3's job)
- Do not build any dashboard features (Agent 4's job)
- Do not create placeholder pages for routes — only layout and error pages

---

## Detailed Instructions

### 1. TypeScript Types

Write these exactly. All other agents depend on these contracts.

**`src/types/listing.ts`**
```typescript
export type ListingStatus = 'active' | 'inactive' | 'sold' | 'removed'

export interface ListingImage {
  id: string
  listing_id: string
  storage_path: string
  sort_order: number
  is_primary: boolean
}

export interface Listing {
  id: string
  user_id: string
  category_id: string
  title: string
  description: string | null
  price: number | null
  location: string | null
  status: ListingStatus
  slug: string
  images: ListingImage[]
  created_at: string
  updated_at: string
}

export interface ListingWithSeller extends Listing {
  seller: Profile
}

export interface CreateListingInput {
  title: string
  description: string
  price: number
  category_id: string
  location: string
}
```

**`src/types/profile.ts`**
```typescript
export interface Profile {
  id: string
  username: string
  phone: string | null
  location: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  is_suspended: boolean
  created_at: string
}
```

**`src/types/category.ts`**
```typescript
export interface Category {
  id: string
  name: string
  slug: string
  icon_url: string | null
  sort_order: number
}
```

**`src/types/auth.ts`**
```typescript
import type { User, Session } from '@supabase/supabase-js'

export type { User as AuthUser, Session }

export interface AuthError {
  message: string
  status?: number
}

export interface ActionResult<T = void> {
  data?: T
  error?: string
}
```

### 2. Supabase Clients

Use `@supabase/ssr` — never `@supabase/auth-helpers-nextjs`.

**`src/lib/supabase/browser.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**`src/lib/supabase/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { supabaseResponse, user }
}
```

### 3. Middleware

**`src/middleware.ts`**

Protected paths: `/dashboard`, `/sell`, `/listings/*/edit`, `/settings`
Admin-only: `/admin`
Everything else: pass through

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_PATHS = ['/dashboard', '/sell', '/settings']
const ADMIN_PATHS = ['/admin']

function isProtected(pathname: string): boolean {
  if (PROTECTED_PATHS.some(p => pathname.startsWith(p))) return true
  if (/^\/listings\/[^/]+\/edit/.test(pathname)) return true
  return false
}

function isAdminOnly(pathname: string): boolean {
  return ADMIN_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (isAdminOnly(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Role check happens in the page itself for admin
    return supabaseResponse
  }

  if (isProtected(pathname) && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 4. Config Validation

**`src/lib/config.ts`**

Validate that required env vars exist at boot — fail loud in development.

```typescript
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

if (typeof window === 'undefined') {
  // Server-side validation
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
} as const
```

### 5. Utilities

**`src/lib/utils/contact.ts`**
```typescript
/**
 * Formats a Zimbabwean phone number into a wa.me WhatsApp link.
 * Strips leading 0 and prepends country code 263.
 * Example: 0771234567 → https://wa.me/263771234567?text=...
 */
export function formatWhatsAppLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const normalized = cleaned.startsWith('0')
    ? `263${cleaned.slice(1)}`
    : cleaned.startsWith('263')
    ? cleaned
    : `263${cleaned}`

  const base = `https://wa.me/${normalized}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('263')) {
    return `+${cleaned}`
  }
  return phone
}
```

**`src/lib/utils/slug.ts`**
```typescript
import { v4 as uuidv4 } from 'uuid'

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)

  const suffix = uuidv4().split('-')[0] // short 8-char suffix
  return `${base}-${suffix}`
}
```

**`src/lib/utils/format.ts`**
```typescript
/**
 * Format a price in USD for Zimbabwe context.
 * Displays as $1,234 (no cents unless needed).
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return 'Price on request'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(dateString).getTime()) / 1000
  )
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s)
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
  }
  return 'Just now'
}
```

### 6. Category Constants

**`src/lib/constants/categories.ts`**
```typescript
import type { Category } from '@/types'

export const STATIC_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Electronics',   slug: 'electronics',  icon_url: null, sort_order: 1 },
  { name: 'Vehicles',      slug: 'vehicles',      icon_url: null, sort_order: 2 },
  { name: 'Property',      slug: 'property',      icon_url: null, sort_order: 3 },
  { name: 'Fashion',       slug: 'fashion',       icon_url: null, sort_order: 4 },
  { name: 'Services',      slug: 'services',      icon_url: null, sort_order: 5 },
  { name: 'Agriculture',   slug: 'agriculture',   icon_url: null, sort_order: 6 },
  { name: 'Jobs',          slug: 'jobs',          icon_url: null, sort_order: 7 },
  { name: 'Home & Garden', slug: 'home-garden',   icon_url: null, sort_order: 8 },
  { name: 'Sports',        slug: 'sports',        icon_url: null, sort_order: 9 },
  { name: 'Other',         slug: 'other',         icon_url: null, sort_order: 10 },
]
```

### 7. UI Primitives

Build clean, accessible, Tailwind-only UI components. Use the brand color `#1A7A4A` as primary.

**`src/components/ui/Button.tsx`** — variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`.

**`src/components/ui/Input.tsx`** — controlled, with label, error message, and helper text support.

**`src/components/ui/Badge.tsx`** — for listing status display. Colors: green=active, gray=inactive, blue=sold, red=removed.

**`src/components/ui/Skeleton.tsx`** — animated pulse skeleton. Accept `className` for sizing.

**`src/components/ui/Toast.tsx`** — context-based toast system. Variants: `success`, `error`, `info`. Provider must wrap root layout.

### 8. Layout Components

**`src/components/layout/Container.tsx`**
```tsx
export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className ?? ''}`}>
      {children}
    </div>
  )
}
```

**`src/components/layout/Navbar.tsx`** — Server Component. Reads auth state via server Supabase client. Shows Login/Signup if unauthenticated, or username + dashboard link if authenticated. Brand color `#1A7A4A`. Sticky top. Desktop: logo left, search center, nav right. Mobile: hamburger triggers `MobileMenu`.

**`src/components/layout/MobileMenu.tsx`** — `'use client'`. useState for open/close. Same links as Navbar.

**`src/components/layout/Footer.tsx`** — copyright, About, Contact links, category list in 2 columns, social links.

### 9. Root Layout & Error Pages

**`src/app/layout.tsx`** — includes ToastProvider, Navbar, main content area, Footer. Sets global font, background, metadata defaults.

**`src/app/not-found.tsx`** — "Page not found" with a link back to homepage and a search bar.

**`src/app/error.tsx`** — `'use client'`. Shows error message with a "Try again" button that calls `reset()` and a link home.

### 10. Database Schema File

**`database/schema.sql`** — Write the full SQL file for pasting into Supabase SQL editor.

Include:
- All four table CREATE statements
- All CHECK constraints
- All generated columns (search_vector)
- All indexes (including GIN index)
- All RLS enable statements
- All RLS policies
- Supabase Storage bucket creation command (as a comment with instructions)
- Category seed data INSERT

---

## Acceptance Criteria

Before handing off to Agent 2:

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run lint` passes with zero errors
- [ ] All type files export their interfaces correctly and are re-exported from `src/types/index.ts`
- [ ] Middleware correctly blocks `/dashboard` without auth and redirects to `/login`
- [ ] `formatWhatsAppLink('0771234567')` returns `https://wa.me/263771234567`
- [ ] `generateSlug('Hello World')` returns a lowercase-hyphenated string with a UUID suffix
- [ ] Root layout renders without errors (Navbar, Footer, ToastProvider all present)
- [ ] `not-found.tsx` and `error.tsx` render without errors
- [ ] `database/schema.sql` is valid SQL with all tables, policies, and indexes

---

## Handoff Notes
<!-- Agent 1 fills this in upon completion -->

**Status:** [ ] Complete
**Build:** [ ] Passing
**Lint:** [ ] Passing
**Notes:**
**Deferred items for Agent 2:**
