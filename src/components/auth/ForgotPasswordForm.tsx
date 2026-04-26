"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type ForgotInput = z.infer<typeof forgotSchema>;

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema) });

  async function onSubmit(data: ForgotInput) {
    setFormError(null);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
      } else {
        await api.post<void>("/api/v1/auth/password/reset/", { email: data.email });
      }
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  if (submitted) {
    return (
      <Card padding="lg" shadow="sm">
        <Card.Header>
          <Card.Title>Check your email</Card.Title>
          <Card.Description>
            If an account exists for that address, we&apos;ve sent a password reset link. Check your inbox (and spam folder).
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Link href="/login" className="text-sm text-apple-blue hover:underline">
            Back to Sign In
          </Link>
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Reset your password</Card.Title>
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
            {formError}
          </div>
        )}

        <Input
          {...register("email")}
          type="email"
          label="Email"
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
