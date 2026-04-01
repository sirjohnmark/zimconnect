"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
      </svg>
      {message}
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerAuth } = useAuthContext();
  const [formError, setFormError] = useState<string | null>(null);
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setFormError(null);
    try {
      await registerAuth(data);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setFormError("An account with this email already exists. Sign in instead.");
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Create an account</Card.Title>
        <Card.Description>Join ZimConnect today — it&apos;s free</Card.Description>
      </Card.Header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <FormAlert message={formError} />}

        <Input
          {...register("name")}
          type="text"
          label="Full Name"
          placeholder="John Doe"
          autoComplete="name"
          error={errors.name?.message}
          required
        />
        <Input
          {...register("email")}
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          required
        />
        <Input
          {...register("password")}
          type="password"
          label="Password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          hint="Use at least 8 characters."
          error={errors.password?.message}
          required
        />
        <Input
          {...register("confirmPassword")}
          type="password"
          label="Confirm Password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          required
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <Card.Footer>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card.Footer>
    </Card>
  );
}
