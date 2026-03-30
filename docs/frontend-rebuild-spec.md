# ZimConnect Frontend Rebuild Specification

## 1. Purpose

This document is the implementation guide for the frontend developer rebuilding ZimConnect with:

- `Next.js` for the frontend
- `Django` for the backend API

The goal is to turn the current marketing-style shell into a complete marketplace product where users can:

- browse listings
- search by category and location
- register and sign in
- create and manage listings
- contact sellers
- save favorites
- manage their profile

This is the frontend handoff document for what to build, how to structure it, and how it should integrate with the Django backend.

## 2. Current State of the Repo

The current repository already uses `Next.js`, `TypeScript`, and `Tailwind CSS`, but it only contains a landing page and shared layout elements.

Current implemented areas:

- homepage in `src/app/page.tsx`
- global layout in `src/app/layout.tsx`
- shared marketing components in `src/components`
- brand direction centered on a Zimbabwe marketplace called `ZimConnect`

Current homepage content already suggests the product direction:

- buying and selling locally
- category browsing
- seller listing creation
- account registration and sign-in
- messaging between buyers and sellers
- trust and safety messaging

Important note:

- the current project is not yet a full marketplace
- many routes used in links do not exist yet
- this document defines the complete frontend that should now be built

## 3. Product Summary

ZimConnect is a Zimbabwe-focused local marketplace where individuals and small businesses can post items or services, discover nearby offers, and connect directly.

Primary user groups:

- guests browsing the marketplace
- registered buyers
- registered sellers
- admin and support users on the Django side

Core product pillars:

- local discovery
- trust and safety
- fast listing creation
- mobile-first browsing
- direct buyer-seller communication

## 4. Frontend Goals

The frontend rebuild should deliver:

- a production-ready `Next.js App Router` application
- a clear separation between public pages, authenticated account pages, and marketplace pages
- reusable UI components and consistent design tokens
- strong mobile responsiveness
- SEO-friendly public pages
- API-driven data loading from Django
- robust form validation and empty/error/loading states

## 5. Non-Goals for the First Release

Unless the product owner explicitly asks for them, these should not block the first release:

- native mobile apps
- real-time socket messaging on day one
- advanced seller analytics dashboards
- payment processing in the first version
- multilingual support in the first version

These can be phased in later.

## 6. Recommended Technical Direction

### Frontend

- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`
- route groups for marketing, auth, marketplace, and account areas
- server components by default
- client components only when needed for interactivity

### Backend

- `Django`
- preferably `Django REST Framework` for API endpoints
- authentication handled by secure HTTP-only cookies or another agreed secure auth flow

### Frontend to Backend Contract

The frontend should treat Django as the source of truth for:

- authentication state
- users and profiles
- categories
- listings
- favorites
- conversations and messages

Do not hardcode marketplace data in the frontend except temporary mocks during development.

## 7. Information Architecture

The frontend should be organized into these route groups.

### Public Marketing Routes

- `/` homepage
- `/about`
- `/how-it-works`
- `/trust-safety`
- `/contact`
- `/terms`
- `/privacy`
- `/rules`

### Marketplace Discovery Routes

- `/categories`
- `/categories/[slug]`
- `/listings`
- `/listings/[slug]` or `/listing/[id]`
- `/search`

### Authentication Routes

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password/[token]`

### Seller and Account Routes

- `/sell`
- `/dashboard`
- `/dashboard/listings`
- `/dashboard/listings/new`
- `/dashboard/listings/[id]/edit`
- `/dashboard/favorites`
- `/dashboard/messages`
- `/dashboard/profile`
- `/dashboard/settings`

### Optional Public Profile Route

- `/seller/[username]`

This is useful for viewing seller information and active listings.

## 8. Core User Flows

The frontend developer should design and build around these flows.

### Guest Browsing Flow

1. User lands on homepage.
2. User explores categories or search.
3. User opens listing detail page.
4. User is prompted to sign in before saving or contacting sellers if required.

### Seller Onboarding Flow

1. User registers an account.
2. User completes profile basics.
3. User clicks `Start Selling`.
4. User creates a listing with title, category, images, description, price, and location.
5. User publishes listing.

### Buyer Inquiry Flow

1. User discovers a listing.
2. User reviews details, photos, price, and seller info.
3. User sends a message to the seller.
4. User can revisit the conversation in the messages area.

### Listing Management Flow

1. Seller opens dashboard.
2. Seller reviews all listings.
3. Seller edits, republishes, archives, or deletes listings.
4. Seller monitors inbound messages.

### Favorite Flow

1. User clicks save on a listing card or detail page.
2. Listing is added to favorites.
3. User sees saved items in dashboard favorites.

## 9. Page-by-Page Build Specification

### 9.1 Homepage `/`

Purpose:

- introduce the brand
- drive browsing
- drive account creation
- drive listing creation

Required sections:

- sticky navigation
- hero section
- value proposition section
- featured or popular categories
- how it works
- trust signals
- strong call to action
- footer

Use the current implementation as the visual starting point. The existing components in `src/components` already define the initial brand tone:

- `Navbar.tsx`
- `Hero.tsx`
- `Features.tsx`
- `Categories.tsx`
- `HowItWorks.tsx`
- `CTA.tsx`
- `Footer.tsx`

Enhancements needed:

- replace static counts with API-driven data if available
- add featured listings section if backend supports it
- ensure all linked routes exist

### 9.2 Categories Page `/categories`

Purpose:

- show all marketplace categories
- help users quickly move into listing discovery

Requirements:

- category grid
- listing count per category
- category icon or image
- search or filter within categories

Data needed from backend:

- category id
- category name
- slug
- icon or image
- listing count

### 9.3 Category Detail `/categories/[slug]`

Purpose:

- show listings inside a selected category

Requirements:

- category header
- subcategory filter if supported
- sort options
- filter drawer on mobile
- listing results grid
- pagination or infinite scroll

Useful filters:

- keyword
- price range
- location
- condition
- posted date
- seller type if supported

### 9.4 Listings Page `/listings`

Purpose:

- broad marketplace browsing without starting from a category

Requirements:

- search bar
- filters
- sort controls
- result count
- listing cards
- pagination

This can share most of its UI and data-loading logic with the category detail page.

### 9.5 Listing Detail `/listings/[slug]`

Purpose:

- show the full details of one listing
- let the user contact the seller or save the listing

Required content:

- image gallery
- title
- price
- location
- posted date
- condition
- category breadcrumb
- full description
- seller summary card
- favorite action
- share action
- report listing action
- contact seller action

Required states:

- loading skeleton
- not found state
- sold or inactive state

### 9.6 Auth Pages

#### `/login`

Requirements:

- email or phone input depending on business rule
- password input
- remember me option if needed
- forgot password link
- validation and backend error messages

#### `/register`

Requirements:

- name
- email
- phone if required
- password
- password confirmation
- terms acceptance

#### `/forgot-password`

Requirements:

- request password reset

#### `/reset-password/[token]`

Requirements:

- set a new password

### 9.7 Sell Entry Page `/sell`

Purpose:

- direct sellers into listing creation

Behavior:

- if user is signed out, redirect to login or register first
- if user is signed in, open the new listing flow

### 9.8 Dashboard `/dashboard`

Purpose:

- give signed-in users a clear summary of their marketplace activity

Suggested sections:

- quick stats
- recent listings
- recent messages
- saved listings
- account completion reminder

### 9.9 My Listings `/dashboard/listings`

Requirements:

- list all current user listings
- status badges such as draft, published, sold, archived
- quick filters by status
- edit action
- delete action
- mark sold action
- duplicate listing action if useful

### 9.10 New Listing `/dashboard/listings/new`

This is one of the most important pages in the product.

Required fields:

- title
- category
- subcategory if supported
- price
- negotiable flag
- location
- description
- images
- condition
- contact preference

Recommended UX:

- multi-step form or well-structured single page form
- autosave draft if backend supports it
- image previews
- field-level validation
- success confirmation after publish

### 9.11 Edit Listing `/dashboard/listings/[id]/edit`

Requirements:

- preload existing listing data
- allow replacing images
- save draft
- publish updates
- archive or deactivate listing

### 9.12 Messages `/dashboard/messages`

Purpose:

- manage buyer-seller conversations

Requirements:

- conversation list
- active thread view
- unread counts
- empty state
- message composer
- timestamp display

If real-time is not available in version one:

- use polling or manual refresh
- structure the UI so sockets can be added later

### 9.13 Favorites `/dashboard/favorites`

Requirements:

- show all saved listings
- allow remove from favorites
- show unavailable items clearly

### 9.14 Profile `/dashboard/profile`

Requirements:

- profile photo
- display name
- phone number
- email
- default location
- public seller bio

### 9.15 Settings `/dashboard/settings`

Requirements:

- password change
- notification preferences
- privacy controls if available

### 9.16 Contact and Legal Pages

The footer already points to these pages and they should be built as standard content pages:

- `/about`
- `/how-it-works`
- `/trust-safety`
- `/contact`
- `/terms`
- `/privacy`
- `/rules`

These can be static pages driven by CMS content later, but the first version can use structured frontend pages with content provided by the business team.

## 10. Reusable Components to Build

The frontend should be built around reusable components, not page-specific one-offs.

Required shared components:

- top navigation
- mobile menu
- footer
- breadcrumb
- listing card
- listing image gallery
- price badge
- category pill
- search bar
- filter panel
- pagination
- empty state
- error state
- loading skeletons
- auth form fields
- image uploader
- dashboard sidebar
- conversation list
- message thread
- modal and confirmation dialog
- toast or inline alert feedback

## 11. Design System Guidance

The current brand direction in the codebase should be preserved and improved.

Existing visual direction:

- clean marketplace layout
- `emerald` as primary accent
- `slate` neutrals
- bright, trustworthy, modern look
- mobile-friendly cards and CTAs

Design rules for the rebuild:

- keep spacing consistent
- use a small set of reusable button and input variants
- define shared tokens for color, radius, shadows, and typography
- ensure all components work well on mobile first
- keep listing cards scannable and image-led
- avoid overly dark UI unless specifically requested

## 12. Suggested Frontend Folder Structure

```text
src/
  app/
    (marketing)/
      page.tsx
      about/page.tsx
      how-it-works/page.tsx
      trust-safety/page.tsx
      contact/page.tsx
      terms/page.tsx
      privacy/page.tsx
      rules/page.tsx
    (auth)/
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      reset-password/[token]/page.tsx
    (marketplace)/
      categories/page.tsx
      categories/[slug]/page.tsx
      listings/page.tsx
      listings/[slug]/page.tsx
      seller/[username]/page.tsx
      sell/page.tsx
    (account)/
      dashboard/page.tsx
      dashboard/listings/page.tsx
      dashboard/listings/new/page.tsx
      dashboard/listings/[id]/edit/page.tsx
      dashboard/messages/page.tsx
      dashboard/favorites/page.tsx
      dashboard/profile/page.tsx
      dashboard/settings/page.tsx
  components/
    layout/
    marketing/
    marketplace/
    dashboard/
    messaging/
    forms/
    ui/
  lib/
    api/
    auth/
    constants/
    hooks/
    utils/
    validators/
  types/
```

## 13. Recommended Data Models for the Frontend

The frontend should use stable shared TypeScript types for API responses.

### Category

```ts
type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  listingCount?: number;
};
```

### Listing

```ts
type Listing = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  negotiable: boolean;
  location: string;
  condition?: string;
  status: "draft" | "published" | "sold" | "archived";
  category: Category;
  images: ListingImage[];
  seller: SellerSummary;
  createdAt: string;
  updatedAt: string;
};
```

### ListingImage

```ts
type ListingImage = {
  id: string;
  url: string;
  alt?: string;
  order: number;
};
```

### SellerSummary

```ts
type SellerSummary = {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  location?: string;
  joinedAt?: string;
};
```

### Conversation

```ts
type Conversation = {
  id: string;
  listing?: {
    id: string;
    title: string;
    slug: string;
  };
  participants: SellerSummary[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
};
```

### Message

```ts
type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};
```

## 14. Proposed Backend API Surface

These endpoints are the recommended contract for the Django team. Adjust naming if needed, but keep the responsibilities stable.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/categories/` | List all categories |
| `GET` | `/api/categories/{slug}/` | Category detail |
| `GET` | `/api/listings/` | Search and filter listings |
| `GET` | `/api/listings/{slug}/` | Listing detail |
| `POST` | `/api/listings/` | Create listing |
| `PATCH` | `/api/listings/{id}/` | Update listing |
| `DELETE` | `/api/listings/{id}/` | Delete listing |
| `POST` | `/api/listings/{id}/favorite/` | Save listing |
| `DELETE` | `/api/listings/{id}/favorite/` | Remove favorite |
| `GET` | `/api/favorites/` | List saved listings |
| `POST` | `/api/auth/login/` | Sign in |
| `POST` | `/api/auth/register/` | Register |
| `POST` | `/api/auth/logout/` | Sign out |
| `POST` | `/api/auth/forgot-password/` | Start reset |
| `POST` | `/api/auth/reset-password/` | Complete reset |
| `GET` | `/api/me/` | Current user profile |
| `PATCH` | `/api/me/` | Update profile |
| `GET` | `/api/me/listings/` | Current user listings |
| `GET` | `/api/conversations/` | List conversations |
| `GET` | `/api/conversations/{id}/messages/` | List messages |
| `POST` | `/api/conversations/` | Start conversation |
| `POST` | `/api/conversations/{id}/messages/` | Send message |
| `POST` | `/api/listings/{id}/report/` | Report listing |

Recommended query parameters for `/api/listings/`:

- `q`
- `category`
- `location`
- `min_price`
- `max_price`
- `condition`
- `ordering`
- `page`
- `page_size`

## 15. Data Fetching Strategy

Use the following approach unless there is a strong reason not to.

### Server-Side Rendering

Use server rendering for:

- homepage
- categories
- category pages
- listing detail pages
- static marketing pages

Benefits:

- better SEO
- faster first render
- easier metadata generation

### Client-Side Interactivity

Use client components for:

- filters and sorting interactions
- image uploads
- messaging UI
- optimistic favorites
- dashboard forms

## 16. Authentication Strategy

Recommended approach:

- Django handles auth
- frontend uses secure cookie-based sessions or secure access and refresh cookies
- do not store long-lived auth tokens in `localStorage`

Frontend requirements:

- route protection for dashboard pages
- automatic redirect for signed-out users
- graceful session expiry handling
- login state available in shared layout components

## 17. Form and Validation Rules

All important forms should have:

- client-side validation
- server-side error display
- disabled submit state while pending
- success feedback
- retry-safe behavior

Critical forms:

- registration
- login
- forgot password
- create listing
- edit listing
- profile update
- message send

## 18. Error, Empty, and Loading States

This part is mandatory, not optional.

Every page or module that loads API data should have:

- loading skeleton
- empty state
- error state
- retry action where appropriate

Examples:

- no listings found
- no saved items yet
- no messages yet
- listing not found
- unauthorized access

## 19. SEO Requirements

Public pages should include:

- meaningful page titles
- descriptions
- canonical URLs
- Open Graph metadata
- structured metadata for listings if practical

Important pages for SEO:

- homepage
- categories
- listing detail pages
- trust and legal pages

## 20. Accessibility Requirements

The frontend must include:

- semantic headings
- keyboard support
- visible focus states
- alt text for listing images
- labels for all inputs
- color contrast that passes accessibility checks

## 21. Performance Expectations

The frontend should be optimized for real-world mobile usage in Zimbabwe.

Requirements:

- compress and lazy-load images
- avoid large client bundles
- prefer server-rendered content where possible
- use pagination to avoid massive result payloads
- keep dashboard interactions responsive

## 22. Suggested Implementation Phases

### Phase 1: Foundation

- clean up the current app structure
- define route groups
- set up shared layout, design tokens, and core UI primitives
- wire API client utilities

### Phase 2: Public Experience

- homepage refinement
- categories
- listings browse
- listing detail
- legal and trust pages

### Phase 3: Authentication and Account

- login
- register
- password reset
- protected dashboard shell
- profile and settings

### Phase 4: Seller Workflows

- create listing
- edit listing
- manage listings
- favorites

### Phase 5: Messaging

- conversations
- message thread
- send message flow

## 23. Definition of Done for the Frontend

The frontend rebuild is complete when:

- all core routes exist
- homepage is production quality
- users can browse categories and listings
- users can register and sign in
- sellers can create and manage listings
- buyers can save listings
- buyers and sellers can exchange messages
- all API-driven pages handle loading, empty, and error states
- the UI works well on mobile and desktop
- the app is connected to Django through stable contracts

## 24. Immediate Work the Frontend Developer Should Start With

Build in this order:

1. shared app structure and layout system
2. route groups and navigation
3. categories, listing cards, and listing detail UI
4. auth pages
5. dashboard shell
6. create and edit listing flows
7. favorites and messages

## 25. Assumptions to Confirm with Backend and Product

The frontend developer should confirm these before final integration:

- exact Django auth method
- whether listing detail route should use `id` or `slug`
- supported listing filters
- whether messaging is real-time or request-response only
- whether image uploads go directly to Django or to object storage
- final category list and taxonomy
- whether phone number is required at registration
- whether public seller profiles are needed in version one

## 26. Summary

The current codebase already gives the team:

- brand name
- landing page direction
- visual tone
- high-level marketplace intent

The frontend rebuild should now expand that into a full marketplace product in `Next.js`, while Django provides the backend API and business logic.

The developer should treat this document as the build specification for the first complete web version of ZimConnect.
