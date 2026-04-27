"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { VerificationGate } from "@/components/ui/VerificationGate";
import {
  createListingSchema,
  type CreateListingInput,
  LISTING_CONDITIONS,
  CONDITION_LABELS,
  ZIMBABWE_CITIES,
  CITY_LABELS,
} from "@/lib/validations/listing";
import { createListing, uploadImages, publishListing } from "@/lib/api/listings";
import { getCategories } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import { ImageUpload, type ImagePreview } from "./ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { Category } from "@/types/category";

// ─── Field components ─────────────────────────────────────────────────────────

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
            : "border-gray-300 focus:border-apple-blue focus:ring-apple-blue"
          }
          disabled:cursor-not-allowed disabled:bg-gray-50`}
        {...props}
      >
        {children}
      </select>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

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
            : "border-gray-300 focus:border-apple-blue focus:ring-apple-blue"
          }
          disabled:cursor-not-allowed disabled:bg-gray-50`}
        {...props}
      />
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

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

// ─── Submit steps ─────────────────────────────────────────────────────────────

type SubmitStep = "idle" | "creating" | "uploading" | "publishing";

const STEP_LABELS: Record<SubmitStep, string> = {
  idle: "Publish Listing",
  creating: "Creating listing…",
  uploading: "Uploading photos…",
  publishing: "Publishing…",
};

// ─── Main form ────────────────────────────────────────────────────────────────

export function CreateListingForm() {
  const router = useRouter();
  const { user } = useAuth();
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  const isVerified = isMock || (user?.is_verified ?? false) || (user?.email_verified ?? false);

  const [formError, setFormError]   = useState<string | null>(null);
  const [images, setImages]         = useState<ImagePreview[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [step, setStep]             = useState<SubmitStep>("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories({ page_size: 200 })
      .then((res) => setCategories(res.filter((c) => c.is_active)))
      .catch(() => { /* categories load silently — user still sees empty select */ });
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: { currency: "USD" },
  });

  const descriptionValue = useWatch({ control, name: "description" }) ?? "";
  const isSubmitting = step !== "idle";

  if (!isVerified) return <VerificationGate action="post a listing" />;

  async function onSubmit(data: CreateListingInput) {
    if (images.length === 0) {
      setImageError("Add at least one photo.");
      return;
    }
    setImageError(null);
    setFormError(null);

    try {
      // Step 1: Create listing (status = DRAFT)
      setStep("creating");
      const listing = await createListing({
        title:       data.title,
        description: data.description,
        price:       data.price,
        currency:    data.currency,
        condition:   data.condition,
        category_id: data.category_id,
        location:    data.location,
      });

      // Step 2: Upload images
      setStep("uploading");
      await uploadImages(listing.id, images.map((i) => i.file));

      // Step 3: Publish
      setStep("publishing");
      await publishListing(listing.id);

      router.push("/dashboard/listings");
    } catch (err) {
      setStep("idle");
      if (err instanceof ApiError || err instanceof Error) {
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
                  label="Price"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  error={errors.price?.message}
                  required
                />

                <Select
                  {...register("currency")}
                  id="currency"
                  label="Currency"
                  error={errors.currency?.message}
                  required
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="ZWL">ZWL — Zimbabwe Dollar</option>
                </Select>
              </div>

              <Select
                {...register("location")}
                id="location"
                label="City / Town"
                error={errors.location?.message}
                required
              >
                <option value="">Select city…</option>
                {ZIMBABWE_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {CITY_LABELS[city] ?? city}
                  </option>
                ))}
              </Select>
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

        {/* ── Right column: category + condition + submit ── */}
        <div className="space-y-5">
          <Card padding="lg">
            <Card.Header>
              <Card.Title>Category &amp; Condition</Card.Title>
            </Card.Header>
            <div className="space-y-4">
              <Select
                {...register("category_id", { valueAsNumber: true })}
                id="category_id"
                label="Category"
                error={errors.category_id?.message}
                required
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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
                <option value="">Select condition…</option>
                {LISTING_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {CONDITION_LABELS[cond]}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Progress indicator during submit */}
          {isSubmitting && (
            <div className="rounded-xl border border-apple-blue/10 bg-light-gray px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-apple-blue">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {STEP_LABELS[step]}
              </div>
            </div>
          )}

          {/* Publish */}
          <Card padding="lg">
            <div className="space-y-3">
              <Button type="submit" fullWidth loading={isSubmitting}>
                {STEP_LABELS[step]}
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
