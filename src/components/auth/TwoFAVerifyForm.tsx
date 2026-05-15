"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verify2FAChallenge } from "@/lib/api/auth";
import { saveUser } from "@/lib/auth/auth";
import { useAuth } from "@/lib/auth/useAuth";
import { ApiError, NetworkError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

interface Props {
  challengeToken: string;
  redirectTo: string;
  stay: boolean;
}

export function TwoFAVerifyForm({ challengeToken, redirectTo, stay }: Props) {
  const router = useRouter();
  const { setUser } = useAuth();

  const [code, setCode]             = useState("");
  const [useBackup, setUseBackup]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!useBackup) {
      // Only allow digits, max 6
      const digits = raw.replace(/\D/g, "").slice(0, 6);
      setCode(digits);
    } else {
      setCode(raw.slice(0, 64));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!code.trim()) {
      setFormError(useBackup ? "Enter a backup recovery code." : "Enter the 6-digit code from your authenticator app.");
      return;
    }
    if (!useBackup && code.length !== 6) {
      setFormError("The code must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const response = await verify2FAChallenge(challengeToken, code.trim(), stay);
      setUser(response.user);
      saveUser(response.user);

      const isAdmin    = response.user.role === "ADMIN" || response.user.role === "MODERATOR";
      const isVerified = response.user.is_verified || response.user.email_verified;

      if (!isAdmin && !isVerified) {
        router.push(`/verify-email?trigger=1&redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        router.push(redirectTo);
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        setFormError("Unable to connect to server. Please check your connection.");
      } else if (err instanceof ApiError) {
        if (err.status === 429) {
          setFormError("Too many attempts. Please wait a moment and try again.");
        } else {
          setFormError(err.message || "Invalid code. Please try again.");
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Two-factor verification</Card.Title>
        <Card.Description>
          {useBackup
            ? "Enter one of your backup recovery codes to continue."
            : "Enter the 6-digit code from your authenticator app."}
        </Card.Description>
      </Card.Header>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <FormAlert message={formError} />}

        {!useBackup ? (
          <div className="space-y-1.5">
            <label htmlFor="totp-code" className="text-sm font-medium text-gray-700">
              Authenticator code
            </label>
            <input
              id="totp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={handleCodeChange}
              placeholder="123456"
              maxLength={6}
              className={cn(
                "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-center text-xl font-mono tracking-[0.4em] text-gray-900 shadow-sm",
                "placeholder:text-gray-300 placeholder:tracking-normal",
                "focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors",
              )}
              aria-label="6-digit authenticator code"
            />
            <p className="text-xs text-gray-400">
              Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and enter the current code.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="backup-code" className="text-sm font-medium text-gray-700">
              Recovery code
            </label>
            <Input
              id="backup-code"
              type="text"
              autoComplete="off"
              autoFocus
              value={code}
              onChange={handleCodeChange}
              placeholder="e.g. a3f9b2c1d4e5"
              aria-label="Backup recovery code"
            />
            <p className="text-xs text-gray-400">
              Each backup code can only be used once.
            </p>
          </div>
        )}

        <Button type="submit" fullWidth loading={loading}>
          {loading ? "Verifying…" : "Continue"}
        </Button>

        <div className="pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={() => { setUseBackup((v) => !v); setCode(""); setFormError(null); }}
            className="text-sm text-apple-blue hover:underline"
          >
            {useBackup
              ? "Use authenticator app instead"
              : "Use a backup recovery code instead"}
          </button>
        </div>
      </form>

      <Card.Footer>
        <p className="text-center text-xs text-gray-400">
          Lost access to your authenticator?{" "}
          <a href="/contact" className="text-apple-blue hover:underline">
            Contact support
          </a>
        </p>
      </Card.Footer>
    </Card>
  );
}
