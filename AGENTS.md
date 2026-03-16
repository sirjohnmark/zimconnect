# ZimConnect — Agents Overview

This document describes the four coding agents used to build ZimConnect. Each agent is a
focused Claude Code sub-agent with its own `AGENT.md` file, responsibilities, tools, and
scope boundaries. They work in sequence based on the build order defined in `CLAUDE.md`.

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ZimConnect Codebase                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   AGENT 1    │  │   AGENT 2    │  │     AGENT 3      │   │
│  │ Foundation   │  │  Auth &      │  │  Listings &      │   │
│  │ & Infra      │  │  Profiles    │  │  Marketplace     │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                              │
│                    ┌──────────────┐                          │
│                    │   AGENT 4    │                          │
│                    │  Dashboard   │                          │
│                    │  & Search    │                          │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Summary Table

| Agent | Name | Covers | Depends On |
|-------|------|---------|------------|
| 1 | Foundation & Infrastructure | Folder structure, Supabase clients, middleware, types, DB schema, layout, Navbar, Footer | Nothing |
| 2 | Auth & Profiles | Signup, login, logout, password reset, profile view, profile edit, settings | Agent 1 |
| 3 | Listings & Marketplace | Categories, listing creation, listing detail, homepage, image upload | Agent 1 + 2 |
| 4 | Dashboard & Search | Seller dashboard, listing management, search, edit listing, admin (Phase 2) | Agent 1 + 2 + 3 |

---

## How to Invoke Each Agent

Each agent has its own file in `.claude/agents/`:

```
.claude/
├── agents/
│   ├── agent-1-foundation.md
│   ├── agent-2-auth.md
│   ├── agent-3-listings.md
│   └── agent-4-dashboard.md
```

In Claude Code, reference an agent by pointing to its file:

```bash
# Example: run Agent 1
claude --agent .claude/agents/agent-1-foundation.md "Set up the project"

# Example: run Agent 2 after Agent 1 is complete
claude --agent .claude/agents/agent-2-auth.md "Build authentication"
```

Or use the `/agent` slash command in interactive Claude Code sessions.

---

## Inter-Agent Contracts

Agents must not break the contracts below. If a later agent needs to change a contract,
it must update the relevant shared files and note the change in its work log.

### Shared type contracts (defined by Agent 1, used by all)
- `src/types/listing.ts` — `Listing`, `ListingWithSeller`, `ListingImage`, `ListingStatus`
- `src/types/profile.ts` — `Profile`
- `src/types/category.ts` — `Category`
- `src/types/auth.ts` — `AuthUser`, `Session`

### Shared Supabase client contracts (defined by Agent 1)
- `createBrowserClient()` → import from `src/lib/supabase/browser.ts`
- `createServerClient()` → import from `src/lib/supabase/server.ts`
- Never create ad-hoc Supabase clients inline

### Shared utility contracts
- `formatWhatsAppLink(phone, message)` → `src/lib/utils/contact.ts`
- `generateSlug(title)` → `src/lib/utils/slug.ts`
- `formatPrice(price)` → `src/lib/utils/format.ts`

---

## Rules All Agents Must Follow

1. Read `CLAUDE.md` before starting any work
2. TypeScript strict mode — no `any` types
3. Server components by default — `'use client'` only when necessary
4. All mutations via Server Actions — no REST API route handlers unless forced
5. All images via `next/image` — never `<img>`
6. All DB queries must be paginated — no unbounded SELECT
7. Handle Supabase `error` return on every query — never assume success
8. Test the happy path AND the error path for every feature
9. Do not touch files outside your defined scope without noting it
10. Commit with correct prefix: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`

---

## Handoff Protocol

When an agent completes its work:

1. Run `npm run build` — must pass with zero errors
2. Run `npm run lint` — must pass with zero errors
3. Write a brief handoff note at the bottom of the agent's `.md` file under `## Handoff Notes`
4. List any TODOs or deferred items for the next agent
5. Confirm all shared contracts are intact

---

## Phase 2 Features (Agent 4 — deferred section)

These are in scope for Agent 4 but marked Phase 2. Do not build until Phase 1 is complete:

- Admin moderation panel (`/admin`)
- `role` column on profiles
- `is_suspended` boolean on profiles
- Admin RLS bypass policy
- `getAllListings()` and `getAllUsers()` in `src/lib/queries/admin.ts`
- `moderateListing()` and `suspendUser()` in `src/lib/actions/admin.ts`
