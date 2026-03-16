export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  phone: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  role: UserRole;
  listings_count: number;
  created_at: string;
}

export type UpdateProfileInput = Partial<
  Pick<Profile, "display_name" | "bio" | "avatar_url" | "location" | "phone">
>;
