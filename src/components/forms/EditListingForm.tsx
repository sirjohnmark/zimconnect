"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateListing } from "@/lib/actions/listings";
import { ZIMBABWE_CITIES } from "@/lib/constants";
import type { Listing, Category } from "@/types";
import type { ActionResult } from "@/types/auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = (hasError: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`;

// ─── Component ───────────────────────────────────────────────────────────────

interface EditListingFormProps {
  listing: Listing;
  categories: Category[];
}

export default function EditListingForm({ listing, categories }: EditListingFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateListing,
    null
  );

  // Redirect to dashboard on success.
  useEffect(() => {
    if (state?.message) {
      router.push("/dashboard");
    }
  }, [state?.message, router]);

  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-6">
      {/* Hidden listing id */}
      <input type="hidden" name="id" value={listing.id} />

      {/* Top-level server error */}
      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <Label htmlFor="title" required>
          Title
        </Label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={100}
          defaultValue={listing.title}
          className={inputCls(!!fe.title)}
        />
        <FieldError messages={fe.title} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" required>
          Description
        </Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={5000}
          defaultValue={listing.description}
          className={`${inputCls(!!fe.description)} resize-y`}
        />
        <FieldError messages={fe.description} />
      </div>

      {/* Price + Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="price" required>
            Price (USD)
          </Label>
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
              defaultValue={listing.price ?? ""}
              className={`block w-full rounded-md border pl-7 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                fe.price ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
              }`}
            />
          </div>
          <FieldError messages={fe.price} />
        </div>

        <div>
          <Label htmlFor="category_id" required>
            Category
          </Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={listing.category_id}
            className={inputCls(!!fe.category_id)}
          >
            <option value="" disabled>
              Select a category…
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ""}
                {cat.name}
              </option>
            ))}
          </select>
          <FieldError messages={fe.category_id} />
        </div>
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location" required>
          City
        </Label>
        <select
          id="location"
          name="location"
          defaultValue={listing.location}
          className={inputCls(!!fe.location)}
        >
          <option value="" disabled>
            Select your city…
          </option>
          {ZIMBABWE_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <FieldError messages={fe.location} />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
