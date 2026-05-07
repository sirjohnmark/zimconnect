"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/api/auth";
import { ApiError, NetworkError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
type FormInput = z.infer<typeof schema>;

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormInput) {
    setFormError(null);
    try {
      await requestPasswordReset(data.email);
      if (USE_MOCK) {
        // Skip the "check your inbox" screen — go straight to the reset form
        // so the dev flow is completable without a real email.
        router.push(
          `/reset-password?mock=1&email=${encodeURIComponent(data.email)}`,
        );
        return;
      }
      setSubmitted(true);
    } catch (err) {
      if (err instanceof NetworkError) {
        setFormError("Unable to connect to the server. Check your internet connection.");
      } else if (err instanceof ApiError) {
        if (err.status === 404) {
          setFormError("Authentication service unavailable. Please try again later.");
        } else if (err.status >= 500) {
          setFormError("Server error. Try again later.");
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  if (submitted) {
    return (
      <Card padding="lg" shadow="sm">
        <Card.Header>
          <Card.Title>Check your inbox</Card.Title>
          <Card.Description>
            If an account with that address exists, we&apos;ve sent a password
            reset link. Check your inbox and spam folder.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <p className="text-center text-sm text-gray-500">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="font-medium text-apple-blue hover:underline"
            >
              Try again
            </button>
            {" · "}
            <Link href="/login" className="font-medium text-apple-blue hover:underline">
              Back to Sign In
            </Link>
          </p>
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Forgot your password?</Card.Title>
        <Card.Description>
          Enter your email address and we&apos;ll send you a reset link.
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

        <Input
          {...register("email")}
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          required
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <Card.Footer>
        <p className="text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-apple-blue hover:underline">
            Sign In
          </Link>
        </p>
      </Card.Footer>
    </Card>
  );
}
