"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useAuth } from "@/lib/auth/useAuth";
import { ApiError, NetworkError } from "@/lib/api/client";
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

const SAFE_REDIRECT_PREFIXES = ["/dashboard", "/verify-email"];

function safeLoginRedirect(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/dashboard";
  if (SAFE_REDIRECT_PREFIXES.some((p) => raw.startsWith(p))) return raw;
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const redirectTo    = safeLoginRedirect(searchParams.get("redirect"));
  const passwordReset = searchParams.get("reset") === "1";

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
      const response = await login(data, staySignedIn);

      if ("requires_2fa" in response && response.requires_2fa) {
        const { challenge_token } = response as unknown as import("@/lib/api/auth").TwoFAChallengeResponse;
        router.push(
          `/verify-2fa?token=${encodeURIComponent(challenge_token)}&redirect=${encodeURIComponent(redirectTo)}&stay=${staySignedIn ? "1" : "0"}`,
        );
        return;
      }

      const u = (response as import("@/lib/api/auth").LoginResponse).user;
      const isAdmin = u.role === "ADMIN" || u.role === "MODERATOR";
      const isVerified = u.is_verified || u.email_verified;
      if (!isAdmin && !isVerified) {
        router.push(`/verify-email?trigger=1&redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        router.push(redirectTo);
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        setFormError("Unable to connect to server.");
      } else if (err instanceof ApiError) {
        if (err.status === 401) {
          setFormError("Invalid login credentials.");
        } else if (err.status === 403) {
          setFormError("Account not verified.");
        } else if (err.status === 429) {
          setFormError("Too many attempts. Please wait a moment and try again.");
        } else if (err.status >= 500) {
          setFormError("Server error. Please try again later.");
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
        <Card.Title>Sign in</Card.Title>
        <Card.Description>Welcome back to Sanganai</Card.Description>
      </Card.Header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {passwordReset && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
            Password updated successfully. Sign in with your new password.
          </div>
        )}
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
            <Link href="/forgot-password" className="text-xs text-apple-blue hover:underline">
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="staySignedIn"
            checked={staySignedIn}
            onChange={(e) => setStaySignedIn(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-apple-blue focus:ring-apple-blue cursor-pointer"
          />
          <label htmlFor="staySignedIn" className="text-sm text-gray-700 cursor-pointer">
            Stay signed in on this device
          </label>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <Card.Footer>
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-apple-blue hover:underline">
            Create one
          </Link>
        </p>
      </Card.Footer>
    </Card>
  );
}
