"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { ZIMBABWE_CITIES } from "@/lib/constants";
import type { Profile } from "@/types";
import type { ActionResult } from "@/types/auth";

interface ProfileFormProps {
  profile: Profile;
  className?: string;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

export default function ProfileForm({ profile, className }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateProfile,
    null
  );

  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className={className}>
      <div className="space-y-6">
        {/* Success message */}
        {state?.message && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {state.message}
          </div>
        )}

        {/* Top-level error */}
        {state?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {/* Display name */}
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            defaultValue={profile.display_name}
            maxLength={60}
            aria-describedby={fe.display_name ? "display_name-error" : undefined}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              fe.display_name ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
          <FieldError messages={fe.display_name} />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={profile.bio ?? ""}
            maxLength={500}
            aria-describedby={fe.bio ? "bio-error" : undefined}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
              fe.bio ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
          <FieldError messages={fe.bio} />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone number{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={profile.phone ?? ""}
            placeholder="+263 77 123 4567"
            aria-describedby={fe.phone ? "phone-error" : undefined}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              fe.phone ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
          <FieldError messages={fe.phone} />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <select
            id="location"
            name="location"
            defaultValue={profile.location ?? ""}
            aria-describedby={fe.location ? "location-error" : undefined}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              fe.location ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          >
            <option value="">Select your city…</option>
            {ZIMBABWE_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <FieldError messages={fe.location} />
        </div>

        {/* Read-only username */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
              @
            </span>
            <input
              type="text"
              value={profile.username}
              readOnly
              className="block w-full rounded-r-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Username cannot be changed.</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
