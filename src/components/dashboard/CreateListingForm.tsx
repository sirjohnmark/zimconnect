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
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-150 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:border-apple-blue focus:ring-apple-blue"
        } disabled:cursor-not-allowed disabled:bg-gray-50`}
        {...props}
      >
        {children}
      </select>

      {error && <p className="text-xs text-red-600">{error}</p>}
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

function Textarea({
  label,
  error,
  charCount,
  maxChars,
  id,
  required,
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>

        {maxChars !== undefined && (
          <span
            className={`text-xs ${
              (charCount ?? 0) > maxChars * 0.9 ? "text-amber-500" : "text-gray-400"
            }`}
          >
            {charCount ?? 0}/{maxChars}
          </span>
        )}
      </div>

      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        className={`w-full resize-none rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-150 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:border-apple-blue focus:ring-apple-blue"
        } disabled:cursor-not-allowed disabled:bg-gray-50`}
        {...props}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function FormAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
      </svg>
      {message}
    </div>
  );
}

type SubmitStep = "idle" | "creating" | "uploading" | "publishing";

const STEP_LABELS: Record<SubmitStep, string> = {
  idle: "Publish Listing",
  creating: "Creating listing...",
  uploading: "Uploading photos...",
  publishing: "Publishing...",
};

export function CreateListingForm() {
  const router = useRouter();
  const { user } = useAuth();

  const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  const isVerified =
    isMock || (user?.is_verified ?? false) || (user?.email_verified ?? false);

  const [formError, setFormError] = useState<string | null>(null);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [step, setStep] = useState<SubmitStep>("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories({ page_size: 200 })
      .then((res) => setCategories(res.filter((category) => category.is_active)))
      .catch(() => {});
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

  const titleValue = useWatch({ control, name: "title" }) ?? "";
  const descriptionValue = useWatch({ control, name: "description" }) ?? "";
  const priceValue = useWatch({ control, name: "price" }) ?? "";
  const categoryValue = useWatch({ control, name: "category_id" });
  const locationValue = useWatch({ control, name: "location" });

  const isSubmitting = step !== "idle";

  const completedSteps = [
    Boolean(titleValue && descriptionValue),
    Boolean(priceValue && categoryValue && locationValue),
    images.length > 0,
  ].filter(Boolean).length;

  if (!isVerified) return <VerificationGate action="post a listing" />;

  async function onSubmit(data: CreateListingInput) {
    if (images.length === 0) {
      setImageError("Add at least one photo. Listings without photos do not sell.");
      return;
    }

    setImageError(null);
    setFormError(null);

    try {
      setStep("creating");

      const listing = await createListing({
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        condition: data.condition,
        category_id: data.category_id,
        location: data.location,
      });

      setStep("uploading");
      await uploadImages(
        listing.id,
        images.map((image) => image.file),
      );

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
      <div className="mb-6 rounded-2xl bg-apple-blue px-5 py-6 text-white shadow-md sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Sell on Sanganai
        </p>

        <h1 className="mt-1 text-2xl font-extrabold">
          Post your listing fast
        </h1>

        <p className="mt-2 max-w-xl text-sm text-white/75">
          Good photos, a clear title, and a realistic price will get you more buyer
          messages. Do not treat this like a form. Treat it like your sales pitch.
        </p>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/70">
            <span>Listing progress</span>
            <span>{completedSteps}/3 complete</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${(completedSteps / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card padding="lg">
            <Card.Header>
              <Card.Title>1. What are you selling?</Card.Title>
              <Card.Description>
                Be specific. Weak titles get ignored.
              </Card.Description>
            </Card.Header>

            {formError && <FormAlert message={formError} />}

            <div className="space-y-5">
              <Input
                {...register("title")}
                id="title"
                label="Title"
                placeholder="e.g. Samsung Galaxy S24, 256GB, Phantom Black"
                error={errors.title?.message}
                required
              />

              <Textarea
                {...register("description")}
                id="description"
                label="Description"
                placeholder="Mention condition, accessories, reason for selling, defects if any, and whether price is negotiable."
                rows={5}
                maxChars={2000}
                charCount={descriptionValue.length}
                error={errors.description?.message}
                required
              />
            </div>
          </Card>

          <Card padding="lg">
            <Card.Header>
              <Card.Title>2. Add photos</Card.Title>
              <Card.Description>
                First photo becomes the cover. Add clear photos from different angles.
              </Card.Description>
            </Card.Header>

            <ImageUpload
              value={images}
              onChange={(nextImages) => {
                setImages(nextImages);
                if (nextImages.length > 0) setImageError(null);
              }}
              max={5}
              error={imageError ?? undefined}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card padding="lg">
            <Card.Header>
              <Card.Title>3. Price & details</Card.Title>
              <Card.Description>
                Buyers filter by these fields. Get them right.
              </Card.Description>
            </Card.Header>

            <div className="space-y-4">
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

              <Select
                {...register("category_id", { valueAsNumber: true })}
                id="category_id"
                label="Category"
                error={errors.category_id?.message}
                required
              >
                <option value="">Select category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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
                <option value="">Select condition...</option>
                {LISTING_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {CONDITION_LABELS[condition]}
                  </option>
                ))}
              </Select>

              <Select
                {...register("location")}
                id="location"
                label="City / Town"
                error={errors.location?.message}
                required
              >
                <option value="">Select city...</option>
                {ZIMBABWE_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {CITY_LABELS[city] ?? city}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {isSubmitting && (
            <div className="rounded-xl border border-apple-blue/10 bg-light-gray px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-apple-blue">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {STEP_LABELS[step]}
              </div>
            </div>
          )}

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

              <p className="text-center text-xs text-gray-400">
                Publish only when the listing is clear enough for a buyer to trust.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}