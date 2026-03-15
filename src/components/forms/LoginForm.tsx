"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import type { ActionResult } from "@/types/auth";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    signIn,
    null
  );

  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-5">
      {/* Top-level error */}
      {state?.error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
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

      {/* Password */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={fe.password ? "password-error" : undefined}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            fe.password ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        <FieldError messages={fe.password} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-green-600 hover:text-green-700">
          Create one
        </Link>
      </p>
    </form>
  );
}
