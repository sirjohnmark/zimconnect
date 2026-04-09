"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { getMySchool, saveSchool, type SchoolProfile, type SchoolType, type SchoolLevel, type SchoolCurriculum } from "@/lib/mock/schools";
import { cn } from "@/lib/utils";

// ─── Image uploader (min 2, max 5) ───────────────────────────────────────────

function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - images.length;
    const toAdd = files.slice(0, remaining);

    let loaded = 0;
    const newImgs: string[] = [];

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          newImgs.push(reader.result);
          loaded++;
          if (loaded === toAdd.length) {
            onChange([...images, ...newImgs]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // reset input
    e.target.value = "";
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-700">
        School Photos <span className="text-gray-400 font-normal">(min 2, max 5)</span>
      </label>

      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 group">
            <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              aria-label="Remove photo"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
              </svg>
            </button>
            <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white font-semibold">
              {i + 1}
            </span>
          </div>
        ))}

        {images.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors",
              images.length < 2
                ? "border-red-300 bg-red-50 text-red-400 hover:border-red-400"
                : "border-gray-200 bg-gray-50 text-gray-400 hover:border-emerald-300 hover:bg-emerald-50",
            )}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            <span className="text-[10px] font-medium">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFiles}
      />

      {images.length < 2 && (
        <p className="text-xs text-red-500">Please upload at least 2 photos of your school.</p>
      )}
      <p className="text-xs text-gray-400">{images.length}/5 photos uploaded. Hover a photo to remove it.</p>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, hint, error, required, children }: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const INPUT = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolDashboardPage() {
  const { user } = useAuth();

  // form state
  const [name, setName]         = useState("");
  const [tagline, setTagline]   = useState("");
  const [description, setDesc]  = useState("");
  const [level, setLevel]           = useState<SchoolLevel>("secondary");
  const [type, setType]             = useState<SchoolType>("day");
  const [curriculum, setCurriculum] = useState<SchoolCurriculum | "">("");
  const [location, setLocation] = useState("");
  const [city, setCity]         = useState("");
  const [images, setImages]     = useState<string[]>([]);

  // fees
  const [hasFees, setHasFees]       = useState(false);
  const [termly, setTermly]         = useState("");
  const [annually, setAnnually]     = useState("");
  const [feeCurrency, setFeeCurr]   = useState<"USD" | "ZWL">("USD");
  const [feeNotes, setFeeNotes]     = useState("");

  // contacts
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite]   = useState("");

  // ui
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [mounted, setMounted]   = useState(false);
  const [existing, setExisting] = useState<SchoolProfile | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    const profile = getMySchool(user.id);
    setExisting(profile);
    if (profile) {
      setName(profile.name);
      setTagline(profile.tagline ?? "");
      setDesc(profile.description);
      setLevel(profile.level);
      setType(profile.type);
      setCurriculum(profile.curriculum ?? "");
      setLocation(profile.location);
      setCity(profile.city);
      setImages(profile.images);
      if (profile.fees) {
        setHasFees(true);
        setTermly(profile.fees.termly ? String(profile.fees.termly) : "");
        setAnnually(profile.fees.annually ? String(profile.fees.annually) : "");
        setFeeCurr(profile.fees.currency);
        setFeeNotes(profile.fees.notes ?? "");
      }
      setPhone(profile.contacts.phone);
      setEmail(profile.contacts.email ?? "");
      setWhatsapp(profile.contacts.whatsapp ?? "");
      setWebsite(profile.contacts.website ?? "");
    }
    setMounted(true);
  }, [user]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim())        errs.name        = "School name is required.";
    if (!description.trim()) errs.description = "Description is required.";
    if (!location.trim())    errs.location    = "Location is required.";
    if (!city.trim())        errs.city        = "City is required.";
    if (!phone.trim())       errs.phone       = "Phone number is required.";
    if (images.length < 2)  errs.images      = "Upload at least 2 photos.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !validate()) return;

    setSaving(true);
    saveSchool({
      ownerId: user.id,
      name: name.trim(),
      tagline: tagline.trim() || undefined,
      description: description.trim(),
      level,
      type,
      curriculum: (curriculum as SchoolCurriculum) || undefined,
      location: location.trim(),
      city: city.trim(),
      images,
      fees: hasFees ? {
        termly:   termly   ? Number(termly)   : undefined,
        annually: annually ? Number(annually) : undefined,
        currency: feeCurrency,
        notes:    feeNotes.trim() || undefined,
      } : undefined,
      contacts: {
        phone:    phone.trim(),
        email:    email.trim()    || undefined,
        whatsapp: whatsapp.trim() || undefined,
        website:  website.trim()  || undefined,
      },
    });

    setSaving(false);
    setSaved(true);
    setExisting(getMySchool(user.id));
    setTimeout(() => setSaved(false), 3000);
  }

  if (!mounted) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="h-7 w-40 animate-pulse rounded-md bg-gray-200" />
        {[1, 2, 3].map((n) => <div key={n} className="h-32 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-2" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {existing ? "Edit School Profile" : "List Your School"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {existing
                ? "Update your school's listing on Sanganai."
                : "Create a public profile so parents and students can find your school."}
            </p>
          </div>
          {existing && (
            <Link href="/schools" className="shrink-0 text-xs font-medium text-emerald-600 hover:underline">
              View listing →
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} noValidate className="space-y-8">

        {/* ── Basic info ── */}
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
          <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Basic Information</p>

          <Field label="School Name" required error={errors.name}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. St. John's College" className={INPUT} />
          </Field>

          <Field label="Tagline / Motto" hint="A short phrase that represents your school (optional)">
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Excellence in Education Since 1953" className={INPUT} />
          </Field>

          <Field label="Description" required error={errors.description} hint="Describe your school — curriculum, facilities, achievements, ethos.">
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="Tell parents and students about your school…"
              className={cn(INPUT, "resize-none")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School Level" required>
              <select value={level} onChange={(e) => setLevel(e.target.value as SchoolLevel)} className={INPUT}>
                <option value="primary">Primary (ECD–Grade 7)</option>
                <option value="secondary">Secondary (Form 1–Upper 6)</option>
                <option value="combined">Combined (Primary & Secondary)</option>
                <option value="tertiary">Tertiary / College</option>
              </select>
            </Field>

            <Field label="School Type" required>
              <select value={type} onChange={(e) => setType(e.target.value as SchoolType)} className={INPUT}>
                <option value="day">Day School</option>
                <option value="boarding">Boarding School</option>
                <option value="both">Day & Boarding</option>
              </select>
            </Field>
          </div>

          <Field label="Curriculum" hint="Select the examination board(s) your school follows.">
            <select value={curriculum} onChange={(e) => setCurriculum(e.target.value as SchoolCurriculum | "")} className={INPUT}>
              <option value="">Not specified</option>
              <option value="zimsec">ZIMSEC (O-Level / A-Level)</option>
              <option value="cambridge">Cambridge (IGCSE / AS & A-Level)</option>
              <option value="both">Both ZIMSEC & Cambridge</option>
            </select>
          </Field>
        </section>

        {/* ── Location ── */}
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
          <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Location</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City / Town" required error={errors.city}>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Harare" className={INPUT} />
            </Field>
            <Field label="Full Address / Suburb" required error={errors.location}>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Borrowdale, Harare" className={INPUT} />
            </Field>
          </div>
        </section>

        {/* ── Fees ── */}
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <p className="text-sm font-bold text-gray-900">School Fees</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-gray-500">Include fees</span>
              <button
                type="button"
                role="switch"
                aria-checked={hasFees}
                onClick={() => setHasFees((v) => !v)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
                  hasFees ? "bg-emerald-500" : "bg-gray-200",
                )}
              >
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5", hasFees ? "translate-x-4.5" : "translate-x-0.5")} />
              </button>
            </label>
          </div>

          {hasFees ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Per Term">
                  <input
                    type="number"
                    value={termly}
                    onChange={(e) => setTermly(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    className={INPUT}
                  />
                </Field>
                <Field label="Per Year">
                  <input
                    type="number"
                    value={annually}
                    onChange={(e) => setAnnually(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    className={INPUT}
                  />
                </Field>
                <Field label="Currency">
                  <select value={feeCurrency} onChange={(e) => setFeeCurr(e.target.value as "USD" | "ZWL")} className={INPUT}>
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                  </select>
                </Field>
              </div>
              <Field label="Fee Notes" hint="e.g. boarding surcharge, payment plans, what is included">
                <textarea
                  value={feeNotes}
                  onChange={(e) => setFeeNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes about fees…"
                  className={cn(INPUT, "resize-none")}
                />
              </Field>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Fees are optional. Toggle on to display fee information on your listing.</p>
          )}
        </section>

        {/* ── Photos ── */}
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
          <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">School Photos</p>
          <ImageUploader images={images} onChange={setImages} />
          {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}
        </section>

        {/* ── Contacts ── */}
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
          <p className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Contact Information</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone Number" required error={errors.phone}>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0242 123 456" className={INPUT} />
            </Field>
            <Field label="Email Address">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admissions@school.ac.zw" className={INPUT} />
            </Field>
            <Field label="WhatsApp Number" hint="Leave blank if same as phone">
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="e.g. 0771234567" className={INPUT} />
            </Field>
            <Field label="Website">
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="e.g. www.myschool.ac.zw" className={INPUT} />
            </Field>
          </div>
        </section>

        {/* ── Submit ── */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.97] transition-all"
          >
            {saving ? "Saving…" : existing ? "Update School Profile" : "Publish School Profile"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Profile saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
