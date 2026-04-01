"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createListingSchema,
  type CreateListingInput,
  LISTING_CONDITIONS,
  LISTING_CATEGORIES,
} from "@/lib/validations/listing";
import { createListing, uploadImages } from "@/lib/data/listings";
import { ApiError } from "@/lib/api/client";
import { ImageUpload, type ImagePreview } from "./ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// ─── Label maps ───────────────────────────────────────────────────────────────

const CONDITION_LABELS: Record<string, string> = {
  "new": "New",
  "like-new": "Like New",
  "good": "Good",
  "fair": "Fair",
  "for-parts": "For Parts",
};

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  vehicles: "Vehicles",
  property: "Property",
  jobs: "Jobs",
  services: "Services",
  fashion: "Fashion",
  agriculture: "Agriculture",
  home: "Home & Garden",
};

// ─── Select field ─────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

function Select({ label, error, hint, id, required, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-150
          ${error
            ? "border-red-400 focus:border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          }
          disabled:cursor-not-allowed disabled:bg-gray-50`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="text-xs text-red-600">{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

// ─── Textarea field ───────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  charCount?: number;
  maxChars?: number;
}

function Textarea({ label, error, charCount, maxChars, id, required, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
        </label>
        {maxChars !== undefined && (
          <span className={`text-xs ${(charCount ?? 0) > maxChars * 0.9 ? "text-amber-500" : "text-gray-400"}`}>
            {charCount ?? 0}/{maxChars}
          </span>
        )}
      </div>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 resize-none
          placeholder:text-gray-400 transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-0
          ${error
            ? "border-red-400 focus:border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          }
          disabled:cursor-not-allowed disabled:bg-gray-50`}
        {...props}
      />
      {error && (
        <p role="alert" className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

// ─── Form-level alert ─────────────────────────────────────────────────────────

function FormAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
      </svg>
      {message}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function CreateListingForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
  });

  const descriptionValue = useWatch({ control, name: "description" }) ?? "";

  async function onSubmit(data: CreateListingInput) {
    if (images.length === 0) {
      setImageError("Add at least one image.");
      return;
    }
    setImageError(null);
    setFormError(null);

    try {
      // 1. Upload files → get back permanent URLs from storage
      const uploaded = await uploadImages(images.map((i) => i.file));

      // 2. Create the listing with the returned image URLs
      await createListing({
        ...data,
        price: Number(data.price),
        images: uploaded,
        seller: { phone: data.phone },
      });

      router.push("/dashboard/listings");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left column: main fields ── */}
        <div className="space-y-5 lg:col-span-2">
          <Card padding="lg">
            <Card.Header>
              <Card.Title>Listing Details</Card.Title>
              <Card.Description>Fill in the details buyers will see.</Card.Description>
            </Card.Header>

            {formError && <FormAlert message={formError} />}

            <div className="space-y-5">
              <Input
                {...register("title")}
                id="title"
                label="Title"
                placeholder="e.g. Samsung Galaxy S24 — 256GB, Phantom Black"
                error={errors.title?.message}
                required
              />

              <Textarea
                {...register("description")}
                id="description"
                label="Description"
                placeholder="Describe your item — condition, included accessories, reason for selling…"
                rows={5}
                maxChars={2000}
                charCount={descriptionValue.length}
                error={errors.description?.message}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  {...register("price")}
                  id="price"
                  type="number"
                  label="Price (USD)"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  error={errors.price?.message}
                  required
                />

                <Input
                  {...register("location")}
                  id="location"
                  label="Location"
                  placeholder="e.g. Harare"
                  error={errors.location?.message}
                  required
                />
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card padding="lg">
            <Card.Header>
              <Card.Title>Photos</Card.Title>
              <Card.Description>First photo will be the cover image. Max 5 photos.</Card.Description>
            </Card.Header>
            <ImageUpload
              value={images}
              onChange={setImages}
              max={5}
              error={imageError ?? undefined}
            />
          </Card>
        </div>

        {/* ── Right column: categorisation + submit ── */}
        <div className="space-y-5">
          <Card padding="lg">
            <Card.Header>
              <Card.Title>Category</Card.Title>
            </Card.Header>
            <div className="space-y-4">
              <Select
                {...register("category")}
                id="category"
                label="Category"
                error={errors.category?.message}
                required
              >
                <option value="">Select category</option>
                {LISTING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </Select>

              <Select
                {...register("condition")}
                id="condition"
                label="Condition"
                error={errors.condition?.message}
                required
              >
                <option value="">Select condition</option>
                {LISTING_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {CONDITION_LABELS[cond]}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Contact */}
          <Card padding="lg">
            <Card.Header>
              <Card.Title>Contact</Card.Title>
              <Card.Description>Buyers will use this to call or WhatsApp you.</Card.Description>
            </Card.Header>
            <Input
              {...register("phone")}
              id="phone"
              type="tel"
              label="Phone Number"
              placeholder="e.g. 0771 234 567"
              hint="Shown as Call and WhatsApp buttons on your listing."
              error={errors.phone?.message}
              required
            />
          </Card>

          {/* Publish */}
          <Card padding="lg">
            <div className="space-y-3">
              <Button type="submit" fullWidth loading={isSubmitting}>
                {isSubmitting ? "Publishing…" : "Publish Listing"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </form>
  );
}
