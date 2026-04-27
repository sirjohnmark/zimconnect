// ─── Backend raw shapes ───────────────────────────────────────────────────────
// These match exactly what Django REST Framework sends over the wire.
// Never add frontend-only fields here.

export interface BackendUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  /** SerializerMethodField — present when the serializer includes it */
  name?: string;
  phone: string;
  /** Canonical profile image field. `avatar` does not exist on the backend. */
  profile_picture: string | null;
  bio: string;
  location: string;
  role: "BUYER" | "SELLER" | "ADMIN" | "MODERATOR";
  phone_verified: boolean;
  email_verified: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number | null;
  icon: string;
  image: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  children?: BackendCategory[];
}

// ─── Writable profile payload ─────────────────────────────────────────────────
// Exact fields PATCH /api/v1/auth/profile accepts.
// Read-only fields (id, email, role, *_verified, is_active, *_at) are excluded.

export interface ProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  phone?: string;
  location?: string;
  profile_picture?: string | null;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

/** Normalize a raw backend user into a frontend AuthUser.
 *  Guarantees `name` is always a non-empty string. */
export function mapUser(raw: BackendUser): BackendUser & { name: string } {
  return {
    ...raw,
    name:
      raw.name?.trim() ||
      `${raw.first_name} ${raw.last_name}`.trim() ||
      raw.username,
  };
}

/** Strip any keys that are not accepted by the profile PATCH endpoint.
 *  Prevents accidentally sending read-only flags (is_verified, role, etc.). */
export function buildProfilePayload(data: ProfileUpdatePayload): ProfileUpdatePayload {
  const out: ProfileUpdatePayload = {};
  if (data.first_name      !== undefined) out.first_name      = data.first_name;
  if (data.last_name       !== undefined) out.last_name       = data.last_name;
  if (data.username        !== undefined) out.username        = data.username;
  if (data.bio             !== undefined) out.bio             = data.bio;
  if (data.phone           !== undefined) out.phone           = data.phone;
  if (data.location        !== undefined) out.location        = data.location;
  if (data.profile_picture !== undefined) out.profile_picture = data.profile_picture;
  return out;
}
