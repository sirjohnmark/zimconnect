"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { createWholesaleListing, getMyWholesaleListings } from "@/lib/mock/wholesale";
import type { WholesaleCategory, WholesaleListing } from "@/types/wholesale";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: WholesaleCategory; label: string }[] = [
  { value: "agriculture", label: "Agriculture & Produce" },
  { value: "electronics", label: "Electronics" },
  { value: "hardware", label: "Hardware & Construction" },
  { value: "catering", label: "Catering & Food" },
  { value: "fashion", label: "Fashion & Clothing" },
  { value: "printing-machinery", label: "Printing & Paper" },
  { value: "mining-equipment", label: "Mining & Fuel" },
  { value: "transportation", label: "Transportation" },
  { value: "general", label: "General" },
];

const MOQ_UNITS = ["units", "kg", "tonnes", "litres", "bags", "boxes", "cartons", "dozens", "metres", "sheets"];
const PRICE_UNITS = ["per unit", "per kg", "per tonne", "per litre", "per bag", "per box", "per carton", "per dozen", "per metre", "per sheet"];

// ─── Input helpers ─────────────────────────────────────────────────────────────

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}
function Field({ label, error, hint, id, required, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={id}
        className={cn(
          "w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:border-amber-500 focus:ring-amber-400",
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────

interface ImagePreview { file: File; dataUrl: string }

function ImageUploader({ images, onChange, error }: {
  images: ImagePreview[];
  onChange: (imgs: ImagePreview[]) => void;
  error?: string;
}) {
  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 5 - images.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const readers = toAdd.map(
      (file) =>
        new Promise<ImagePreview>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ file, dataUrl: reader.result as string });
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((previews) => onChange([...images, ...previews]));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative h-20 w-24 overflow-hidden rounded-lg border border-gray-200 group">
            <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className={cn(
            "flex h-20 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-gray-400 hover:border-amber-400 hover:text-amber-500 transition-colors",
            error ? "border-red-300" : "border-gray-200",
          )}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            <span className="mt-1 text-xs">Add photo</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">{images.length}/5 photos added</p>
    </div>
  );
}

// ─── My listings list ─────────────────────────────────────────────────────────

function MyListings() {
  const listings = getMyWholesaleListings("me");
  if (listings.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">My Wholesale Listings</h3>
      </div>
      <ul className="divide-y divide-gray-100">
        {listings.map((l) => (
          <li key={l.id} className="flex items-center gap-3 px-5 py-3">
            <div className="h-10 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
              {l.images[0] && <img src={l.images[0].url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{l.title}</p>
              <p className="text-xs text-gray-400">${l.price} {l.priceUnit} · MOQ: {l.moq} {l.moqUnit}</p>
            </div>
            <span className="text-xs text-gray-400">{l.location}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<string, string>>;

export default function WholesaleDashboardPage() {
  const router = useRouter();
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    priceUnit: "per unit",
    moq: "",
    moqUnit: "units",
    location: "",
    sublocation: "",
    phone: "",
    category: "" as WholesaleCategory | "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.title.trim() || form.title.length < 5) e.title = "Title must be at least 5 characters.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Enter a valid price greater than 0.";
    if (!form.moq || isNaN(Number(form.moq)) || Number(form.moq) < 1) e.moq = "Enter a valid minimum order quantity.";
    if (!form.location.trim()) e.location = "Location is required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (form.phone && form.phone.replace(/\D/g, "").length < 9) e.phone = "Enter a valid phone number.";
    if (images.length === 0) e.images = "Add at least one photo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    createWholesaleListing({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      priceUnit: form.priceUnit,
      moq: Number(form.moq),
      moqUnit: form.moqUnit,
      location: form.location.trim(),
      sublocation: form.sublocation.trim() || undefined,
      category: form.category || undefined,
      images: images.map((img) => ({ url: img.dataUrl })),
      seller: { id: "me", phone: form.phone.trim() },
      delivery: { available: deliveryAvailable, note: deliveryNote.trim() || undefined },
    });

    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => router.push("/wholesale"), 1500);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-9 w-9 text-amber-600">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-lg font-bold text-gray-900">Listing published!</p>
        <p className="text-sm text-gray-500">Redirecting to wholesale marketplace…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/wholesale" label="Back to Wholesale" className="-ml-1" />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-600">
            <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
            <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
            <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Wholesale Listing</h1>
          <p className="text-sm text-gray-500">List your products for bulk buyers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 lg:grid-cols-3">

          {/* Left: main details */}
          <div className="space-y-5 lg:col-span-2">

            {/* Basic info */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Product Details</h2>

              <Field
                id="title"
                label="Product Name"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Fresh Tomatoes — Grade A, Samsung LED TVs 43 inch"
                error={errors.title}
                required
              />

              <div className="flex flex-col gap-1">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Describe the product — quality, sourcing, packaging, availability…"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-colors"
                />
                <p className="text-right text-xs text-gray-400">{form.description.length}/1000</p>
              </div>
            </div>

            {/* Pricing & MOQ */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Pricing & Minimum Order</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Unit Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={cn(
                        "w-28 rounded-md border bg-white px-3 py-2 text-sm text-gray-900",
                        "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-colors",
                        errors.price ? "border-red-400" : "border-gray-300",
                      )}
                    />
                    <select
                      value={form.priceUnit}
                      onChange={(e) => set("priceUnit", e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-colors"
                    >
                      {PRICE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Minimum Order Qty <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.moq}
                      onChange={(e) => set("moq", e.target.value)}
                      placeholder="10"
                      min="1"
                      className={cn(
                        "w-24 rounded-md border bg-white px-3 py-2 text-sm text-gray-900",
                        "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-colors",
                        errors.moq ? "border-red-400" : "border-gray-300",
                      )}
                    />
                    <select
                      value={form.moqUnit}
                      onChange={(e) => set("moqUnit", e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-colors"
                    >
                      {MOQ_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  {errors.moq && <p className="text-xs text-red-600">{errors.moq}</p>}
                  <p className="text-xs text-gray-400">Smallest quantity a buyer can order</p>
                </div>
              </div>

              {/* Price preview */}
              {form.price && form.moq && (
                <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-600 shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-amber-800">
                    Min. order value: <strong>${(Number(form.price) * Number(form.moq)).toLocaleString()}</strong> ({form.moq} {form.moqUnit} × ${form.price} {form.priceUnit})
                  </span>
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Photos</h2>
              <ImageUploader images={images} onChange={setImages} error={errors.images} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Category */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Category</h2>
              <div className="flex flex-col gap-1">
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-colors"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Location</h2>
              <Field
                id="location"
                label="City / Town"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Harare, Mutare"
                error={errors.location}
                required
              />
              <Field
                id="sublocation"
                label="Area / Suburb"
                value={form.sublocation}
                onChange={(e) => set("sublocation", e.target.value)}
                placeholder="e.g. CBD, Msasa, Workington"
                hint="Helps buyers searching by area"
              />
            </div>

            {/* Contact */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Contact</h2>
              <Field
                id="phone"
                type="tel"
                label="Phone Number"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. 0771 234 567"
                hint="Buyers will call or WhatsApp you"
                error={errors.phone}
                required
              />
            </div>

            {/* Delivery */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Delivery</h2>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">
                  {deliveryAvailable ? "Yes, I offer delivery" : "Collection only"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={deliveryAvailable}
                  onClick={() => setDeliveryAvailable((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${deliveryAvailable ? "bg-amber-500" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${deliveryAvailable ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {deliveryAvailable && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="deliveryNote" className="text-sm font-medium text-gray-700">
                    Delivery note <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="deliveryNote"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    rows={2}
                    maxLength={200}
                    placeholder="e.g. Free delivery within Harare for orders over 100 kg"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 resize-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 active:scale-[0.97] disabled:opacity-70 transition-all shadow-sm"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Publishing…
                  </>
                ) : "Publish Wholesale Listing"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.97] disabled:opacity-70 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>

        </div>
      </form>

      {/* My existing listings */}
      <MyListings />
    </div>
  );
}
