"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { confirmPasswordReset } from "@/lib/api/auth";
import { ApiError, NetworkError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Eye toggle icon ──────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
      <path d="M10.748 13.93l2.523 2.524a10.006 10.006 0 0 1-8.607-3.43 1.651 1.651 0 0 1 0-1.185 10.007 10.007 0 0 1 1.048-1.58L4.4 8.92A10.04 10.04 0 0 0 .666 13.41a1.651 1.651 0 0 0 0 1.185A10.004 10.004 0 0 0 10 21c1.97 0 3.81-.576 5.355-1.57l-2.422-2.422a4 4 0 0 1-2.185.922Z" />
    </svg>
  );
}

// ─── Password field with show/hide toggle ─────────────────────────────────────

function PasswordInput({
  label,
  placeholder,
  autoComplete,
  error,
  show,
  onToggle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-near-black">
        {label}
        <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-near-black",
            "placeholder:text-gray-400 transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-400/20"
              : "border-border-base focus:border-apple-blue focus:ring-apple-blue/20",
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs text-red-600">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Link-based (real): /reset-password?token=<token>
  // Mock-based:        /reset-password?mock=1&email=<encoded-email>
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const isMock = searchParams.get("mock") === "1";

  const [formError,   setFormError]   = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  // Missing token — the user navigated here directly without a real link
  const missingToken = !isMock && !token;

  async function onSubmit(data: ResetPasswordInput) {
    setFormError(null);
    try {
      await confirmPasswordReset(
        isMock ? email : "",
        isMock ? "mock-reset" : token,
        data.new_password1,
        data.new_password2,
      );
      setSuccess(true);
      setTimeout(() => router.push("/login?reset=1"), 1500);
    } catch (err) {
      if (err instanceof NetworkError) {
        setFormError("Unable to connect to server.");
      } else if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setFormError(
          "This reset link has expired or is no longer valid. Please request a new one.",
        );
      } else if (err instanceof ApiError && err.status >= 500) {
        setFormError("Server error. Please try again later.");
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  // ─── Missing / invalid token ────────────────────────────────────────────────

  if (missingToken) {
    return (
      <Card padding="lg" shadow="sm">
        <Card.Header>
          <Card.Title>Invalid reset link</Card.Title>
          <Card.Description>
            This password reset link is missing required parameters. Please
            request a new link.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-apple-blue hover:underline"
          >
            Request a new reset link
          </Link>
        </Card.Footer>
      </Card>
    );
  }

  // ─── Success ────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <Card padding="lg" shadow="sm">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-9 w-9 text-green-500" aria-hidden="true">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </span>
          <p className="font-semibold text-gray-900">Password updated!</p>
          <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
        </div>
      </Card>
    );
  }

  // ─── Password entry form ────────────────────────────────────────────────────

  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Set a new password</Card.Title>
        <Card.Description>
          Choose a strong password. You&apos;ll use it to sign in from now on.
        </Card.Description>
      </Card.Header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
            </svg>
            <span>{formError}</span>
          </div>
        )}

        <PasswordInput
          {...register("new_password1")}
          label="New password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.new_password1?.message}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
        />

        <PasswordInput
          {...register("new_password2")}
          label="Confirm new password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.new_password2?.message}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update Password"}
        </Button>
      </form>

      <Card.Footer>
        <p className="text-center text-sm text-gray-500">
          <Link
            href="/forgot-password"
            className="font-medium text-apple-blue hover:underline"
          >
            Request a new link
          </Link>
          {" · "}
          <Link href="/login" className="font-medium text-apple-blue hover:underline">
            Back to Sign In
          </Link>
        </p>
      </Card.Footer>
    </Card>
  );
}
