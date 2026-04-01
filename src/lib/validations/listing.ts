import { z } from "zod";

export const LISTING_CONDITIONS = ["new", "like-new", "good", "fair", "for-parts"] as const;

export const LISTING_CATEGORIES = [
  "electronics",
  "vehicles",
  "property",
  "jobs",
  "services",
  "fashion",
  "agriculture",
  "home",
] as const;

export const createListingSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be under 100 characters"),

  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid price greater than 0"),

  description: z
    .string()
    .min(1, "Description is required")
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be under 2000 characters"),

  location: z
    .string()
    .min(1, "Location is required"),

  condition: z.enum(LISTING_CONDITIONS, { error: "Select a condition" }),

  category: z.enum(LISTING_CATEGORIES, { error: "Select a category" }),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
