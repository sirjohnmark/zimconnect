"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { ZIMBABWE_CITIES } from "@/lib/constants";
import type { ActionResult } from "@/types/auth";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    signUp,
    null
  );

  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-5">
      {/* Top-level error */}
      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={fe.email ? "email-error" : undefined}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            fe.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        <FieldError messages={fe.email} />
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
            @
          </span>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            placeholder="your_handle"
            aria-describedby={fe.username ? "username-error" : undefined}
            className={`block w-full rounded-r-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              fe.username ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
        </div>
        <FieldError messages={fe.username} />
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
          required
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

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-describedby={fe.password ? "password-error" : undefined}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            fe.password ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
        <FieldError messages={fe.password} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}
