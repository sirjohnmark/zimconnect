import { z } from "zod";

// Matches the actual listings table: id, user_id, category_id, title,
// description, price, location, status, slug, created_at
export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters"),
  price: z.coerce
    .number()
    .positive("Price must be a positive number"),
  category_id: z.string().min(1, "Please select a category"),
  location: z.string().min(1, "Location is required"),
  condition: z.enum(
    ["new", "used_like_new", "used_good", "used_fair", "for_parts"],
    { error: "Please select a condition" }
  ),
});

export const updateListingSchema = createListingSchema.partial();

// Extracts text fields from FormData. Images are handled separately as Files.
export function parseListingFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price") || undefined,
    category_id: formData.get("category_id"),
    location: formData.get("location"),
    condition: formData.get("condition"),
  };
}

export type CreateListingSchema = z.infer<typeof createListingSchema>;
export type UpdateListingSchema = z.infer<typeof updateListingSchema>;
