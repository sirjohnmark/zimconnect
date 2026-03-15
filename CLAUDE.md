# CLAUDE.md — ZimConnect Project Intelligence

> This file is the operating brain for Claude when working on ZimConnect.
> Read this at the start of every session. Follow every rule without exception.

---

## Project Identity

**ZimConnect** is a Zimbabwean local marketplace web app.
**Stack:** Next.js 14 App Router · TypeScript (strict) · Tailwind CSS · Supabase (PostgreSQL + Auth + Storage)
**Phase:** 1 — Core marketplace loop only

---

## Workflow Orchestration

### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- Before writing code, state: what you are building, which files you will create or modify, and why
- If something goes sideways, STOP and re-plan — do not keep pushing broken code
- Use plan mode for verification steps, not just building
- Never add features outside the current phase scope without asking first

### 2. Subagent Strategy

- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and file analysis to subagents
- For complex problems (e.g. RLS policies + query + component at once) split into focused subagents
- One task per subagent: one subagent writes the query, another writes the component
- Never mix database logic and UI component work in the same output block

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write a rule for yourself that prevents the same mistake from recurring
- Ruthlessly iterate on these lessons until mistake rate drops
- Review `tasks/lessons.md` at the start of every session involving the corrected area

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff between expected behavior and your implementation before calling it done
- Ask yourself: "Would a senior Next.js + Supabase engineer approve this?"
- Always confirm: RLS policies are set, types match the DB schema, and server/client split is correct
- Run type checks mentally — if a prop type is unknown, stop and look it up

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky — knowing everything about Next.js 14 App Router — implement the correct solution
- Skip over-engineering for simple, obvious fixes
- Challenge your own implementation before presenting it
- Never use `any` in TypeScript — find the correct type

### 6. Autonomous Bug Fixing

- When given a bug report: diagnose it, then fix it — do not ask for hand-holding
- Point to logs, errors, or type failures — then resolve them
- Zero context switching required from the user for bugs within your knowledge
- Fix Supabase RLS errors, TypeScript errors, and missing env vars without being told how

---

## Task Management

1. **Plan First** — Write plan to `tasks/todo.md` with checkable items before touching code
2. **Verify Plan** — Check in before starting implementation on anything over 3 files
3. **Track Progress** — Mark items complete as you go using `- [x]`
4. **Explain Changes** — High-level summary at each step: what changed and why
5. **Document Results** — Add a review section to `tasks/todo.md` when a feature is done
6. **Capture Lessons** — Update `tasks/lessons.md` after any correction or discovery

---

## Core Principles

- **Simplicity First** — Make every change as simple as possible. Impact minimal code.
- **No Laziness** — Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact** — Changes should only touch what is necessary. Avoid introducing side effects.
- **Server/Client Discipline** — Never use `use client` unless interactivity demands it. Default to server components.
- **Security Always** — Every user-mutating action must verify `auth.uid() === resource.user_id` before proceeding.

---

## Architecture Rules

### Next.js App Router

- Default to **Server Components** — only use `'use client'` for interactivity (forms, menus, modals)
- Data fetching belongs in **Server Components** or **Server Actions** — never in `useEffect`
- Use **Server Actions** (`'use server'`) for all form submissions and mutations
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client — server-side only
- Use `next/image` for **every** image — never raw `<img>` tags

### Supabase

- **Always** use the correct client: `browser.ts` for client components, `server.ts` for server components
- **Always** check auth before mutating: verify `auth.uid() === row.user_id`
- **Never** write unbounded SELECT queries — always add `.range()` or `.limit()` pagination
- RLS policies must be active on: `listings`, `listing_images`, `profiles`
- Storage path pattern: `{user_id}/{listing_id}/{uuid}.{ext}`

### TypeScript

- Strict mode is non-negotiable — `"strict": true` in tsconfig
- All DB rows must map to types in `src/types/`
- `ListingStatus` = `'active' | 'inactive' | 'sold'` — never use raw strings
- Never use `as any` — if you need to cast, find the correct type first

### Styling

- **Tailwind only** — no inline styles, no CSS modules, no styled-components
- Mobile-first: design for small screens, scale up
- Brand green: `#1A7A4A` — use `text-[#1A7A4A]` or define in `tailwind.config.ts`

---

## Agents & Skills

### Agent: `auth-agent`
**Responsibility:** Authentication, session management, middleware
**Files owned:**
- `src/lib/auth/`
- `src/lib/supabase/`
- `src/middleware.ts`
- `src/lib/actions/auth.ts`
- `src/components/forms/LoginForm.tsx`
- `src/components/forms/SignupForm.tsx`

**Rules:**
- Always use `@supabase/ssr` — never `@supabase/supabase-js` directly in Next.js App Router
- Cookie handling must use the Next.js 14 pattern with `get/set/remove`
- Middleware must protect: `/dashboard`, `/sell`, `/listings/*/edit`, `/settings`
- On signup: create profile row in `profiles` table immediately after `auth.signUp()`

---

### Agent: `listing-agent`
**Responsibility:** Listing creation, editing, deletion, image upload
**Files owned:**
- `src/lib/actions/listings.ts`
- `src/lib/queries/listings.ts`
- `src/lib/validations/listing.ts`
- `src/components/forms/ListingForm.tsx`
- `src/components/listings/`
- `src/app/(dashboard)/sell/`
- `src/app/(dashboard)/listings/`

**Rules:**
- Validate with Zod before any Supabase insert
- Generate slug from title: `slugify(title) + '-' + uuid().slice(0, 8)`
- Images: max 6, max 5MB each, types: jpeg/png/webp only
- On delete: remove images from Supabase Storage AND delete DB rows
- Always verify ownership: `if (listing.user_id !== session.user.id) throw Unauthorized`

---

### Agent: `search-agent`
**Responsibility:** Full-text search, category browsing, filtering
**Files owned:**
- `src/lib/queries/search.ts`
- `src/lib/queries/categories.ts`
- `src/components/forms/SearchForm.tsx`
- `src/app/(public)/search/`
- `src/app/(public)/category/`

**Rules:**
- Use `search_vector @@ to_tsquery('english', $1)` — never `ilike`
- Sanitize query input before passing to `to_tsquery`
- Paginate all results: 12 per page using `.range(from, to)`
- Empty query = show recent active listings (fallback)
- Category page uses slug param: `getCategoryBySlug(slug)` then `getListingsByCategoryId(id)`

---

### Agent: `dashboard-agent`
**Responsibility:** Seller dashboard, listing management table, stats
**Files owned:**
- `src/components/dashboard/`
- `src/app/(dashboard)/dashboard/`
- `src/app/(dashboard)/settings/`
- `src/lib/queries/profiles.ts`
- `src/lib/actions/profile.ts`

**Rules:**
- Dashboard is a server component — fetch listings server-side
- Confirm before delete — use a modal, never inline delete without confirmation
- Show `EmptyState` component when user has no listings
- `StatsCards` shows: total listings, active listings, inactive listings

---

### Agent: `ui-agent`
**Responsibility:** Shared UI components, layout, homepage sections
**Files owned:**
- `src/components/ui/`
- `src/components/layout/`
- `src/components/home/`
- `src/app/layout.tsx`
- `src/app/(public)/page.tsx`

**Rules:**
- All UI components must accept `className` prop for extensibility
- `Button` component must support: `variant` (primary, secondary, ghost), `size` (sm, md, lg), `isLoading` state
- `Navbar` is a server component — `MobileMenu` is a client component
- `Container` = `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Homepage data fetching must be parallelized: `Promise.all([getCategories(), getRecentListings()])`

---

### Agent: `contact-agent`
**Responsibility:** Seller contact utilities, WhatsApp link generation
**Files owned:**
- `src/lib/utils/contact.ts`
- `src/components/listings/SellerContactCard.tsx`

**Rules:**
- Zimbabwe format: strip leading `0`, prepend `263`
- WhatsApp link: `https://wa.me/263{number}?text={encodeURIComponent(message)}`
- Phone reveal: hide last 4 digits until user clicks — then show full number
- Never store raw phone without formatting validation

---

## File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `ListingCard.tsx` |
| Pages | lowercase `page.tsx` | `page.tsx` |
| Utilities | camelCase | `formatPrice.ts` |
| Actions | camelCase | `listings.ts` |
| Types | camelCase | `listing.ts` |
| Constants | camelCase | `categories.ts` |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          # safe for client
NEXT_PUBLIC_SUPABASE_ANON_KEY     # safe for client
SUPABASE_SERVICE_ROLE_KEY         # server ONLY — never expose
```

Validate env vars at boot in `src/lib/config.ts`. Throw a clear error if any are missing.

---

## Tasks Folder Structure

```
tasks/
├── todo.md        # active feature checklist — updated every session
└── lessons.md     # mistakes + rules learned — reviewed every session
```

---

## What Claude Must Never Do

- Never use `<img>` — always `next/image`
- Never use `useEffect` for data fetching — use server components
- Never skip RLS policy verification when writing mutations
- Never use `any` in TypeScript
- Never commit `.env.local` — it is in `.gitignore`
- Never push directly to `main` — always use a feature branch
- Never build Phase 2 features (admin, promoted listings, messaging) until Phase 1 is stable
- Never write unbounded database queries — always paginate

---

*ZimConnect CLAUDE.md — keep this file updated as the project evolves.*
