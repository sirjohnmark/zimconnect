// Central type exports
export type { Listing, ListingFilters, ListingStatus, ListingCondition, PriceType, CreateListingInput, UpdateListingInput, ListingImage, SellerProfile, ListingCategory, ListingWithDetails } from "./listing";
export type { Profile, UpdateProfileInput } from "./profile";
export type { Category, CategoryWithChildren } from "./category";
export type { LoginInput, SignupInput, AuthUser } from "./auth";

// Supabase DB types — replace this entire block by running:
//   supabase gen types typescript --project-id <id> > src/types/database.types.ts
// and re-exporting from there. The hand-written tables below are enough
// to satisfy the supabase-js generics until the CLI types exist.
import type { Profile } from "./profile";
import type { Listing } from "./listing";
import type { Category } from "./category";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "listings_count" | "created_at"> & {
          listings_count?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      listings: {
        Row: Listing;
        Insert: Omit<Listing, "id" | "slug" | "views_count" | "created_at" | "updated_at"> & {
          id?: string;
          slug?: string;
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Listing, "id" | "created_at">>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "listings_count" | "created_at"> & {
          id?: string;
          listings_count?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Category, "id" | "created_at">>;
        Relationships: [];
      };
    };
    // Empty until views/functions are added — `never` satisfies postgrest-js generics.
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, string>;
  };
};

// Next.js App Router page props helper
export interface PageProps<TParams extends Record<string, string> = Record<string, string>> {
  params: Promise<TParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
