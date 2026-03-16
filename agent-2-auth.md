# Agent 2 — Authentication & Profiles

## Identity
You are the **Auth & Profiles Agent** for ZimConnect. You own the full authentication flow
and user profile system. Every other agent depends on users being able to sign up and log in.

Read `CLAUDE.md` fully before writing a single line of code.
Confirm Agent 1 has completed and `npm run build` passes before starting.

---

## Prerequisites

Before starting, verify these files exist and are correct (created by Agent 1):
- `src/lib/supabase/browser.ts` — `createClient()` browser client
- `src/lib/supabase/server.ts` — `createClient()` server client
- `src/types/profile.ts` — `Profile` interface
- `src/types/auth.ts` — `AuthUser`, `Session`, `ActionResult`
- `src/middleware.ts` — protects `/dashboard`, `/settings`, `/sell`
- `src/components/ui/` — `Button`, `Input`, `Toast` components

If any are missing, stop and notify the user before proceeding.

---

## Scope

You are responsible for the following files:

### Server Actions
- `src/lib/actions/auth.ts` — signUp, signIn, signOut, resetPassword
- `src/lib/actions/profile.ts` — updateProfile

### Queries
- `src/lib/queries/profiles.ts` — getProfileById, getProfileByUsername

### Validations
- `src/lib/validations/auth.ts` — Zod schemas for signup and login

### Auth Helper
- `src/lib/auth/helpers.ts` — getUser(), requireUser(), getCurrentProfile()

### Form Components
- `src/components/forms/SignupForm.tsx`
- `src/components/forms/LoginForm.tsx`
- `src/components/forms/ProfileForm.tsx`

### Pages
- `src/app/(public)/login/page.tsx`
- `src/app/(public)/signup/page.tsx`
- `src/app/(public)/profile/[username]/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`

---

## What You Must NOT Do
- Do not modify `src/middleware.ts` (Agent 1's file)
- Do not build listing features (Agent 3's job)
- Do not build dashboard listing tables (Agent 4's job)
- Do not create Supabase clients — import from `src/lib/supabase/`

---

## Detailed Instructions

### 1. Validation Schemas

**`src/lib/validations/auth.ts`**
```typescript
import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  phone: z
    .string()
    .optional()
    .refine(
      val => !val || /^(\+263|0)[0-9]{9}$/.test(val.replace(/\s/g, '')),
      'Enter a valid Zimbabwean phone number'
    ),
  location: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

### 2. Auth Server Actions

**`src/lib/actions/auth.ts`**

Rules:
- All actions are `'use server'`
- On signup: create Supabase auth user, then insert into `profiles` table
- On successful login: redirect to `/dashboard`
- On signOut: redirect to `/`
- Return `{ error: string }` on failure — do NOT throw
- Use `revalidatePath('/')` after auth state changes

```typescript
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { signupSchema, loginSchema } from '@/lib/validations/auth'
import type { ActionResult } from '@/types'

export async function signUp(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
    phone: formData.get('phone') as string || undefined,
    location: formData.get('location') as string || undefined,
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create account' }

  // 2. Create profile row
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      username: parsed.data.username,
      phone: parsed.data.phone ?? null,
      location: parsed.data.location ?? null,
    })

  if (profileError) {
    // Username conflict is the most common error
    if (profileError.code === '23505') {
      return { error: 'Username is already taken' }
    }
    return { error: 'Failed to create profile' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return { error: 'Invalid email or password' }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/settings`,
  })

  if (error) return { error: error.message }
  return { data: undefined }
}
```

### 3. Profile Actions & Queries

**`src/lib/queries/profiles.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Profile
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error) return null
  return data as Profile
}
```

**`src/lib/actions/profile.ts`**
```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const updates: Record<string, string | null> = {}
  const phone = formData.get('phone') as string | null
  const location = formData.get('location') as string | null
  const username = formData.get('username') as string | null

  if (username && username.length >= 3) updates.username = username
  if (phone !== null) updates.phone = phone || null
  if (location !== null) updates.location = location || null

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'Username is already taken' }
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/settings')
  revalidatePath(`/profile/${username}`)
  return {}
}
```

### 4. Auth Helper

**`src/lib/auth/helpers.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AuthUser, Profile } from '@/types'

/** Returns user or null. Does NOT redirect. */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Returns user or redirects to /login. Use in protected Server Components. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/** Returns the full profile for the current user. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data as Profile | null
}
```

### 5. Form Components

**`src/components/forms/SignupForm.tsx`** — `'use client'`

- Fields: email, password, username, phone (optional), location (optional)
- Uses `useTransition` to show loading state during Server Action call
- Shows inline error message returned from `signUp` action
- Includes link to `/login`
- Password field with show/hide toggle

**`src/components/forms/LoginForm.tsx`** — `'use client'`

- Fields: email, password
- Uses `useTransition` for loading state
- Shows inline error from `signIn` action
- Includes "Forgot password?" link
- Includes link to `/signup`

**`src/components/forms/ProfileForm.tsx`** — `'use client'`

- Fields: username, phone, location
- Pre-populated with current profile data (passed as prop)
- Shows success or error message after submit
- Uses `useTransition` for pending state

### 6. Pages

**`src/app/(public)/login/page.tsx`** — Server Component
- Shows `LoginForm`
- If user is already logged in, redirect to `/dashboard`
- Clean centered layout with ZimConnect logo

**`src/app/(public)/signup/page.tsx`** — Server Component
- Shows `SignupForm`
- If user is already logged in, redirect to `/dashboard`

**`src/app/(public)/profile/[username]/page.tsx`** — Server Component
- Fetch profile by username using `getProfileByUsername()`
- If not found, call `notFound()`
- Show: avatar (or initials placeholder), username, location, join date
- Show grid of user's active listings (import `ListingGrid` — may be a stub if Agent 3 hasn't run yet)
- Add `generateMetadata` for SEO: title = `{username} — ZimConnect`

**`src/app/(dashboard)/settings/page.tsx`** — Server Component
- Call `requireUser()` — redirect to login if not authenticated
- Fetch current profile with `getCurrentProfile()`
- Render `ProfileForm` with profile data pre-populated
- Show sign-out button that calls `signOut` action

---

## Acceptance Criteria

Before handing off to Agent 3:

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run lint` passes
- [ ] A new user can sign up and land on `/dashboard`
- [ ] A user can log in and land on `/dashboard`
- [ ] `signOut` redirects to `/`
- [ ] Duplicate username returns a readable error message
- [ ] Invalid login credentials return "Invalid email or password" (not a Supabase raw error)
- [ ] `/settings` is inaccessible without auth (middleware redirects)
- [ ] Profile form updates username/phone/location correctly
- [ ] `/profile/[username]` page renders for a valid username, returns 404 for unknown

---

## Handoff Notes
<!-- Agent 2 fills this in upon completion -->

**Status:** [ ] Complete
**Build:** [ ] Passing
**Lint:** [ ] Passing
**Notes:**
**Deferred items for Agent 3:**
