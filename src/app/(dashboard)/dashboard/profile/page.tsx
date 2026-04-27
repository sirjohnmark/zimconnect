"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { getAccessToken } from "@/lib/auth/auth";
import { cn } from "@/lib/utils";
import type { ProfileUpdatePayload } from "@/lib/api/mappers";

// ─── File validation ──────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES      = 5 * 1024 * 1024; // 5 MB

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return "Only JPEG, PNG, or WebP images are allowed.";
  if (file.size > MAX_IMAGE_BYTES)
    return "Image must be under 5 MB.";
  return null;
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

function AvatarUpload({
  name,
  avatar,
  onFileChange,
  onRemove,
  onError,
}: {
  name: string;
  avatar?: string;
  onFileChange: (file: File, preview: string) => void;
  onRemove: () => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = name.charAt(0).toUpperCase();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const err = validateImageFile(file);
    if (err) { onError(err); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onFileChange(file, reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
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
        <p className="mt-0.5 text-xs text-gray-500">JPG or PNG, max 5 MB. Click the photo to change it.</p>
        {avatar && (
          <button type="button" onClick={onRemove} className="mt-2 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, id, hint, error, children }: { label: string; id: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error  && <p className="text-xs text-red-600" role="alert">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const INPUT = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900",
  "placeholder:text-gray-400 shadow-sm",
  "focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors duration-150",
  "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
);

// ─── Upload avatar to backend ─────────────────────────────────────────────────

async function uploadAvatar(file: File): Promise<string> {
  // Validate before sending — defence in depth alongside server-side checks
  const err = validateImageFile(file);
  if (err) throw new Error(err);

  const token = getAccessToken(); // read from in-memory store, never localStorage
  const form  = new FormData();
  form.append("avatar", file);

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30_000); // 30 s for upload
  try {
    const res = await fetch("/api/v1/auth/avatar", {
      method:  "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    form,
      signal:  controller.signal,
    });
    if (!res.ok) throw new Error("Avatar upload failed");
    const data = await res.json() as { url: string };
    return data.url;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoading, updateUser } = useAuth();
  const displayName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || user?.username || "U";

  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [username,   setUsername]   = useState("");
  const [bio,        setBio]        = useState("");
  const [phone,      setPhone]      = useState("");
  const [location,   setLocation]   = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setUsername(user.username ?? "");
      setBio(user.bio ?? "");
      setPhone(user.phone ?? "");
      setLocation(user.location ?? "");
      setAvatarPreview(user.profile_picture ?? "");
    }
  }, [user]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!username.trim())  errs.username  = "Username is required.";
    if (username.trim() && !/^[a-zA-Z0-9_]+$/.test(username.trim())) errs.username = "Only letters, numbers, and underscores.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      // Upload new avatar first — the avatar endpoint handles saving the file on
      // the backend and returns the stored URL.  We must NOT re-send that URL in
      // the profile PATCH because Django's ImageField only accepts multipart file
      // data, never a plain string ("The submitted data was not a file").
      if (avatarFile) {
        try {
          await uploadAvatar(avatarFile);
        } catch {
          // avatar upload failed — continue saving text fields, photo unchanged
        }
      }

      // Build the profile PATCH payload.  profile_picture is intentionally omitted
      // when a file was just uploaded (already saved by uploadAvatar) or when the
      // picture is unchanged.  We only send null to explicitly clear the photo.
      const payload: ProfileUpdatePayload = {
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        username:   username.trim(),
        bio:        bio.trim()       || undefined,
        phone:      phone.trim()     || undefined,
        location:   location.trim()  || undefined,
      };

      // User removed their photo — send null so the backend clears the field.
      // Never send a URL string here; Django's ImageField rejects it.
      if (!avatarFile && !avatarPreview) {
        payload.profile_picture = null;
      }

      await updateUser(payload);

      setAvatarFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to save changes. Please try again.");
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

        {/* Avatar */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <AvatarUpload
            name={`${firstName} ${lastName}`.trim() || displayName}
            avatar={avatarPreview}
            onFileChange={(file, preview) => { setAvatarFile(file); setAvatarPreview(preview); setError(null); }}
            onRemove={() => { setAvatarFile(null); setAvatarPreview(""); }}
            onError={(msg) => setError(msg)}
          />
        </div>

        {/* Personal info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" id="first_name" error={fieldErrors.firstName}>
              <input id="first_name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alice" autoComplete="given-name" className={INPUT} />
            </Field>
            <Field label="Last Name" id="last_name">
              <input id="last_name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Moyo" autoComplete="family-name" className={INPUT} />
            </Field>
          </div>

          <Field label="Username" id="username" error={fieldErrors.username} hint="Visible on your public profile.">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
              <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="alicemoyo" autoComplete="username" className={cn(INPUT, "pl-8")} />
            </div>
          </Field>

          <Field label="Email Address" id="email" hint="Email cannot be changed here.">
            <input id="email" type="email" value={user?.email ?? ""} disabled className={INPUT} />
          </Field>

          <Field label="Phone Number" id="phone" hint="Used for Call and WhatsApp buttons on your listings.">
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0771 234 567" autoComplete="tel" className={INPUT} />
          </Field>

          <Field label="Location" id="location" hint="City or area shown to buyers browsing your listings.">
            <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Harare, Bulawayo…" autoComplete="address-level2" className={INPUT} />
          </Field>

          <Field label="Bio" id="bio" hint="A short description shown on your public profile.">
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder="Tell buyers a little about yourself…"
              className={cn(INPUT, "resize-none")} />
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
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              Profile updated successfully
            </span>
          )}
        </div>
      </form>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">Permanently delete your account and all your listings. This cannot be undone.</p>
        <button type="button" className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
}
