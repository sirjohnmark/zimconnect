"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { createListingSchema, updateListingSchema, parseListingFormData } from "@/lib/validations/listing";
import { SUPPORTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB, MAX_IMAGES_PER_LISTING } from "@/lib/constants";
import type { ActionResult } from "@/types/auth";

const BUCKET = "listing-images";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStoragePath(userId: string, listingId: string, filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  return `${userId}/${listingId}/${randomUUID()}.${ext}`;
}

function validateImageFiles(files: File[]): string | null {
  if (!files.length) return "At least one image is required.";
  if (files.length > MAX_IMAGES_PER_LISTING)
    return `You can upload a maximum of ${MAX_IMAGES_PER_LISTING} images.`;

  for (const file of files) {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
      return `"${file.name}" is not supported. Use JPEG, PNG, or WebP.`;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return `"${file.name}" exceeds the ${MAX_IMAGE_SIZE_MB} MB limit.`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// createListing
// ---------------------------------------------------------------------------
// FormData fields: title, description, price, category_id, location
// FormData files:  images (multiple File entries)
//
// Flow:
//   1. Auth + field validation
//   2. Insert listing as "draft" to secure the ID
//   3. Upload each image to Storage
//   4. Insert listing_images rows
//   5. Activate listing — if anything in 3–4 fails, delete the draft
// ---------------------------------------------------------------------------
export async function createListing(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult & { slug?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to post a listing." };

  // --- Validate text fields ---
  const raw = parseListingFormData(formData);
  const parsed = createListingSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // --- Validate image files ---
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);
  const imageError = validateImageFiles(files);
  if (imageError) {
    return { fieldErrors: { images: [imageError] } };
  }

  const { title, description, price, category_id, location, condition } = parsed.data;
  const listingId = randomUUID();
  const slug = `${slugify(title)}-${listingId.slice(0, 8)}`;

  // --- Insert listing as draft ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any).from("listings").insert({
    id: listingId,
    slug,
    title,
    description,
    price,
    category_id,
    user_id: user.id,
    location,
    condition,
    status: "draft",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "A listing with this title already exists. Try a slightly different title." };
    }
    return { error: insertError.message };
  }

  // --- Upload images ---
  const imageRows: { listing_id: string; storage_path: string; sort_order: number; is_primary: boolean }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const storagePath = getStoragePath(user.id, listingId, file.name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: uploadError } = await (supabase as any).storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      // Clean up the draft listing; listing_images cascade-deletes via FK.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("listings").delete().eq("id", listingId);
      return { error: `Image upload failed: ${uploadError.message}` };
    }

    imageRows.push({
      listing_id: listingId,
      storage_path: storagePath,
      sort_order: i,
      is_primary: i === 0,
    });
  }

  // --- Insert listing_images rows ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: imgRowsError } = await (supabase as any)
    .from("listing_images")
    .insert(imageRows);

  if (imgRowsError) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("listings").delete().eq("id", listingId);
    return { error: "Failed to save images. Please try again." };
  }

  // --- Activate listing + store public image URLs ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const imageUrls = imageRows.map(
    (r) => `${supabaseUrl}/storage/v1/object/public/listing-images/${r.storage_path}`
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: activateError } = await (supabase as any)
    .from("listings")
    .update({ status: "active", images: imageUrls })
    .eq("id", listingId);

  if (activateError) {
    return { error: activateError.message };
  }

  return { slug };
}

// ---------------------------------------------------------------------------
// updateListing
// ---------------------------------------------------------------------------
// FormData fields: id (required), title, description, price, category_id, location
// Image updates are handled separately (not in scope for initial release).
// ---------------------------------------------------------------------------
export async function updateListing(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to edit a listing." };

  const listingId = formData.get("id") as string;
  if (!listingId) return { error: "Missing listing ID." };

  // Verify ownership before touching anything else.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: fetchError } = await (supabase as any)
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchError || !existing) return { error: "Listing not found." };
  if (existing.user_id !== user.id) return { error: "You do not own this listing." };

  const raw = parseListingFormData(formData);
  const parsed = updateListingSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.title) {
    updates.slug = `${slugify(parsed.data.title)}-${listingId.slice(0, 8)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("listings")
    .update(updates)
    .eq("id", listingId)
    .eq("user_id", user.id); // ownership enforced at query level too

  if (updateError) return { error: updateError.message };

  return { message: "Listing updated." };
}

// ---------------------------------------------------------------------------
// deleteListing
// ---------------------------------------------------------------------------
// Soft-deletes the listing and removes Storage images.
// ---------------------------------------------------------------------------
export async function deleteListing(listingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Verify ownership and fetch image paths in one query.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing, error: fetchError } = await (supabase as any)
    .from("listings")
    .select("user_id, listing_images(storage_path)")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchError || !listing) return { error: "Listing not found." };
  if (listing.user_id !== user.id) return { error: "You do not own this listing." };

  // Soft-delete first — disappears from public queries immediately.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await (supabase as any)
    .from("listings")
    .update({ status: "deleted" })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (deleteError) return { error: deleteError.message };

  // Remove images from Storage (fire-and-forget — don't block response).
  const paths = (listing.listing_images as { storage_path: string }[]).map(
    (r) => r.storage_path
  );
  if (paths.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (supabase as any).storage.from(BUCKET).remove(paths);
  }

  return { message: "Listing deleted." };
}
