"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";

// ─── Avatar upload ────────────────────────────────────────────────────────────

function AvatarUpload({
  name,
  avatar,
  onAvatarChange,
}: {
  name: string;
  avatar?: string;
  onAvatarChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = name.charAt(0).toUpperCase();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onAvatarChange(reader.result);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full overflow-hidden bg-apple-blue/10 ring-4 ring-white shadow-md hover:ring-apple-blue/40 transition-all"
        aria-label="Change profile picture"
      >
        {avatar ? (
          <Image src={avatar} alt="Profile" fill className="object-cover" />
        ) : (
          <span className="text-3xl font-bold text-apple-blue">{initial}</span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </div>
      </button>

      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />

      <div>
        <p className="text-sm font-semibold text-gray-900">Profile Photo</p>
        <p className="mt-0.5 text-xs text-gray-500">JPG, PNG or GIF. Click the photo to change it.</p>
        {avatar && (
          <button
            type="button"
            onClick={() => onAvatarChange("")}
            className="mt-2 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  id,
  hint,
  error,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const INPUT_CLASS = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900",
  "placeholder:text-gray-400 shadow-sm",
  "focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors duration-150",
  "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoading, updateUser } = useAuth();

  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Populate fields once user loads
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setLocation(user.location ?? "");
      setAvatar(user.avatar ?? "");
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setError(null);

    if (!name.trim()) {
      setNameError("Full name is required.");
      return;
    }

    setSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        avatar: avatar || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-40 animate-pulse rounded-md bg-gray-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <BackButton href="/dashboard" label="Dashboard" className="mb-2 -ml-1" />
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your personal information and how buyers see you.</p>
      </div>

      <form onSubmit={handleSave} noValidate className="space-y-6">

        {/* Avatar card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <AvatarUpload
            name={name || user?.name || "U"}
            avatar={avatar}
            onAvatarChange={setAvatar}
          />
        </div>

        {/* Info card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>

          <Field label="Full Name" id="name" error={nameError ?? undefined}>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Email Address" id="email" hint="Email cannot be changed.">
            <input
              id="email"
              type="email"
              value={user?.email ?? ""}
              disabled
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Phone Number" id="phone" hint="Used for Call and WhatsApp buttons on your listings.">
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0771 234 567"
              autoComplete="tel"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Location" id="location" hint="City or area — shown to buyers browsing your listings.">
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Harare, Bulawayo…"
              autoComplete="address-level2"
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-apple-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-apple-blue active:scale-[0.97] disabled:opacity-60 transition-all duration-75"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-apple-blue">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              Saved successfully
            </span>
          )}
        </div>
      </form>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">Permanently delete your account and all your listings. This cannot be undone.</p>
        <button
          type="button"
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
