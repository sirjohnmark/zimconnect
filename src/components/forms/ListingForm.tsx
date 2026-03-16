"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { createListing } from "@/lib/actions/listings";
import { ZIMBABWE_CITIES, SUPPORTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB, MAX_IMAGES_PER_LISTING } from "@/lib/constants";
import type { Category } from "@/types";
import type { ActionResult } from "@/types/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingFormProps {
  categories: Category[];
}

type FormState = (ActionResult & { slug?: string }) | null;

interface ImagePreview {
  file: File;
  objectUrl: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = (hasError: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`;

const ACCEPT = SUPPORTED_IMAGE_TYPES.join(",");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ListingForm({ categories }: ListingFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createListing,
    null
  );
  const [, startTransition] = useTransition();

  // Redirect to listing detail on success.
  useEffect(() => {
    if (state?.slug) {
      router.push(`/listing/${state.slug}`);
    }
  }, [state?.slug, router]);

  // Revoke object URLs when the component unmounts to avoid memory leaks.
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Image selection
  // -------------------------------------------------------------------------

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset so the same file can be re-selected after removal

    if (!incoming.length) return;

    const remaining = MAX_IMAGES_PER_LISTING - previews.length;
    if (remaining <= 0) {
      setImageError(`Maximum ${MAX_IMAGES_PER_LISTING} images allowed.`);
      return;
    }

    const errors: string[] = [];
    const valid: ImagePreview[] = [];

    for (const file of incoming.slice(0, remaining)) {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
        errors.push(`"${file.name}": unsupported type (use JPEG, PNG, or WebP).`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds ${MAX_IMAGE_SIZE_MB} MB.`);
        continue;
      }
      valid.push({ file, objectUrl: URL.createObjectURL(file) });
    }

    if (errors.length) {
      setImageError(errors[0]);
    } else {
      setImageError(null);
    }

    if (valid.length) {
      setPreviews((prev) => [...prev, ...valid]);
    }
  }

  function removeImage(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].objectUrl);
      return prev.filter((_, i) => i !== index);
    });
    setImageError(null);
  }

  // -------------------------------------------------------------------------
  // Form submit — build FormData manually so we control the File list
  // -------------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (previews.length === 0) {
      setImageError("At least one image is required.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    // Replace whatever the browser put in "images" with our curated file list.
    fd.delete("images");
    previews.forEach((p) => fd.append("images", p.file));

    startTransition(() => formAction(fd));
  }

  const fe = state?.fieldErrors ?? {};
  const serverImageError = fe.images?.[0];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Top-level error */}
      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <Label htmlFor="title" required>Title</Label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={100}
          placeholder="e.g. iPhone 14 Pro Max 256GB"
          className={inputCls(!!fe.title)}
        />
        <FieldError messages={fe.title} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" required>Description</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={5000}
          placeholder="Describe your item — condition, age, any faults, reason for selling…"
          className={`${inputCls(!!fe.description)} resize-y`}
        />
        <FieldError messages={fe.description} />
      </div>

      {/* Price + Category side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price */}
        <div>
          <Label htmlFor="price" required>Price (USD)</Label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">
              $
            </span>
            <input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className={`block w-full rounded-md border pl-7 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                fe.price ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
              }`}
            />
          </div>
          <FieldError messages={fe.price} />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category_id" required>Category</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue=""
            className={inputCls(!!fe.category_id)}
          >
            <option value="" disabled>Select a category…</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
              </option>
            ))}
          </select>
          <FieldError messages={fe.category_id} />
        </div>
      </div>

      {/* Condition + Location side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Condition */}
        <div>
          <Label htmlFor="condition" required>Condition</Label>
          <select
            id="condition"
            name="condition"
            defaultValue=""
            className={inputCls(!!fe.condition)}
          >
            <option value="" disabled>Select condition…</option>
            <option value="new">New</option>
            <option value="used_like_new">Used — Like New</option>
            <option value="used_good">Used — Good</option>
            <option value="used_fair">Used — Fair</option>
            <option value="for_parts">For Parts / Not Working</option>
          </select>
          <FieldError messages={fe.condition} />
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location" required>City</Label>
          <select
            id="location"
            name="location"
            defaultValue=""
            className={inputCls(!!fe.location)}
          >
            <option value="" disabled>Select your city…</option>
            {ZIMBABWE_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <FieldError messages={fe.location} />
        </div>
      </div>

      {/* Image upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="image-input" required>Photos</Label>
          <span className="text-xs text-gray-400">
            {previews.length} / {MAX_IMAGES_PER_LISTING}
          </span>
        </div>

        {/* Preview grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            {previews.map((p, i) => (
              <div key={p.objectUrl} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                <Image
                  src={p.objectUrl}
                  alt={`Preview ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                {/* Primary badge */}
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white leading-none">
                    Cover
                  </span>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label={`Remove image ${i + 1}`}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add more slot */}
            {previews.length < MAX_IMAGES_PER_LISTING && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 flex flex-col items-center justify-center text-gray-400 hover:text-green-600 transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-[10px] mt-1">Add</span>
              </button>
            )}
          </div>
        )}

        {/* Drop zone (shown when no images yet) */}
        {previews.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex flex-col items-center gap-2 rounded-lg border-2 border-dashed py-10 transition-colors ${
              imageError || serverImageError
                ? "border-red-400 bg-red-50"
                : "border-gray-300 hover:border-green-400"
            }`}
          >
            <ImagePlus className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Click to add photos
            </span>
            <span className="text-xs text-gray-400">
              JPEG, PNG or WebP · max {MAX_IMAGE_SIZE_MB} MB each · up to {MAX_IMAGES_PER_LISTING} photos
            </span>
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="image-input"
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
        />

        {/* Image errors (client-side or server-side) */}
        {(imageError || serverImageError) && (
          <p className="mt-1.5 text-sm text-red-600">{imageError ?? serverImageError}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Publishing…" : "Post listing"}
      </button>
    </form>
  );
}
