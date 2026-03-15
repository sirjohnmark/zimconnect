// TODO: implement
export { formatPrice, formatDate, formatRelativeDate } from "./format";

export function slugify(text: string): string {
  // TODO: implement
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  // TODO: replace with clsx/tailwind-merge
  return classes.filter(Boolean).join(" ");
}

/**
 * Constructs a public Supabase Storage URL for a listing image.
 * storage_path format: {userId}/{listingId}/{uuid}.{ext}
 */
export function getListingImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/listing-images/${storagePath}`;
}
