"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useAuth } from "@/lib/auth/useAuth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// ─── Form-level alert ─────────────────────────────────────────────────────────

function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <svg
        className="mt-px h-4 w-4 shrink-0"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
      </svg>
      {message}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setFormError(null);
    try {
      await login(data);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setFormError("No account found with this email. Please create an account first.");
        } else if (err.status === 401) {
          setFormError("Incorrect password. Please try again.");
        } else if (err.status === 429) {
          setFormError("Too many attempts. Please wait a moment and try again.");
        } else {
          setFormError(err.message);
        }
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Sign in</Card.Title>
        <Card.Description>Welcome back to Sanganai</Card.Description>
      </Card.Header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Form-level error (wrong credentials, server error, etc.) */}
        {formError && <FormAlert message={formError} />}

        <Input
          {...register("email")}
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          required
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            required
          />
        </div>

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <Card.Footer>
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-emerald-600 hover:underline">
            Create one
          </Link>
        </p>
      </Card.Footer>
    </Card>
  );
}
