"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import {
  sendEmailVerificationOtp,
  verifyEmailAddress,
  resendEmailVerificationOtp,
} from "@/lib/api/auth";
import { generateAndStoreOtp } from "@/lib/auth/auth";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── Types ────────────────────────────────────────────────────────────────────

type OtpStatus = "idle" | "error" | "success";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

// ─── Alert ────────────────────────────────────────────────────────────────────

function Alert({ message, type = "error" }: { message: string; type?: "error" | "info" | "success" }) {
  const styles = {
    error:   "border-red-200 bg-red-50 text-red-700",
    info:    "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-apple-blue/20 bg-light-gray text-apple-blue",
  };
  return (
    <div role="alert" className={cn("flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm", styles[type])}>
      {type === "error" && (
        <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
        </svg>
      )}
      {type === "info" && (
        <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-6-3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7.25 7a.75.75 0 0 0 0 1.5h.25v2.25h-.25a.75.75 0 0 0 0 1.5h2a.75.75 0 0 0 0-1.5H9V7.75A.75.75 0 0 0 8.25 7h-1Z" clipRule="evenodd" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  );
}

// ─── OTP digit input ──────────────────────────────────────────────────────────

function OtpInput({ digits, onChange, status = "idle" }: {
  digits: string[];
  onChange: (next: string[]) => void;
  status?: OtpStatus;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 1) {
      const next = [...digits];
      for (let i = 0; i < raw.length && idx + i < 6; i++) next[idx + i] = raw[i];
      onChange(next);
      inputs.current[Math.min(idx + raw.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[idx] = raw;
    onChange(next);
    if (raw && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ""; onChange(next);
      } else if (idx > 0) {
        const next = [...digits]; next[idx - 1] = ""; onChange(next);
        inputs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  }

  const boxStyle: Record<OtpStatus, string> = {
    idle:    "border-gray-200 bg-white text-gray-800 focus:ring-apple-blue focus:border-apple-blue",
    error:   "border-red-400 bg-red-50 text-red-700 focus:ring-red-400 focus:border-red-400",
    success: "border-apple-blue bg-light-gray text-near-black focus:ring-apple-blue focus:border-apple-blue",
  };
  const filledStyle: Record<OtpStatus, string> = {
    idle:    "border-apple-blue bg-light-gray text-near-black",
    error:   "border-red-400 bg-red-50 text-red-700",
    success: "border-apple-blue bg-apple-blue/10 text-near-black",
  };

  return (
    <div className={cn("flex gap-2 justify-center", status === "error" && "animate-[shake_0.35s_ease-in-out]")}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={status === "success"}
          className={cn(
            "h-12 w-11 rounded-xl border text-center text-xl font-bold tracking-widest transition-all duration-150",
            "focus:outline-none focus:ring-2",
            d ? filledStyle[status] : boxStyle[status],
            status === "success" && "cursor-default",
          )}
        />
      ))}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function EmailVerificationForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, setUser } = useAuth();
  const redirectTo   = searchParams.get("redirect") ?? "/dashboard";
  // trigger=1 means we need to send a fresh OTP on mount (e.g. coming from gate/settings)
  const triggerSend  = searchParams.get("trigger") === "1";

  const [otpDigits,  setOtpDigits]  = useState<string[]>(Array(6).fill(""));
  const [otpStatus,  setOtpStatus]  = useState<OtpStatus>("idle");
  const [error,      setError]      = useState<string | null>(null);
  const [verifying,  setVerifying]  = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setCooldown] = useState(0);
  const [mockCode,   setMockCode]   = useState<string | null>(null);

  const otpCode     = otpDigits.join("");
  const otpComplete = otpDigits.every((d) => d !== "");

  // One-time initialisation once user is available:
  // - Mock: generate a local OTP to show in the info banner
  // - Real + triggerSend: call send-otp to deliver a fresh code
  // - Real + !triggerSend: OTP was already sent by registration/profile — just start cooldown
  const initialized = useRef(false);
  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;

    if (USE_MOCK) {
      const code = generateAndStoreOtp(user.email, "email");
      setMockCode(code);
      startCooldown();
      return;
    }

    if (triggerSend) {
      setSendingOtp(true);
      sendEmailVerificationOtp()
        .then(() => startCooldown())
        .catch((err: unknown) => {
          if (err instanceof ApiError) setError(err.message);
        })
        .finally(() => setSendingOtp(false));
    } else {
      startCooldown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otpComplete && !verifying && otpStatus === "idle") {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpComplete, otpStatus]);

  // Redirect away if the user was ALREADY verified before this page loaded.
  // Guard on otpStatus so this never fires while handleVerify is in progress.
  useEffect(() => {
    if (!isLoading && user?.email_verified && otpStatus !== "success") {
      router.replace(redirectTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/verify-email");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  function startCooldown() {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleVerify() {
    if (!otpComplete || verifying || !user) return;
    setVerifying(true);
    setError(null);

    try {
      const updated = await verifyEmailAddress(otpCode);
      setUser(updated);
      setOtpStatus("success");
      await new Promise((r) => setTimeout(r, 600));
      window.location.href = redirectTo;
    } catch (err) {
      setOtpStatus("idle");
      if (err instanceof ApiError && err.status === 422) {
        setError("Code expired. Please request a new one.");
        setOtpDigits(Array(6).fill(""));
        setCooldown(0);
      } else if (err instanceof ApiError && err.status === 429) {
        setError(err.message);
      } else if (err instanceof ApiError && err.status === 400) {
        setOtpStatus("error");
        setError("Incorrect code. Please try again.");
        setTimeout(() => { setOtpDigits(Array(6).fill("")); setOtpStatus("idle"); }, 800);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || sendingOtp) return;
    setError(null);
    setOtpDigits(Array(6).fill(""));
    setOtpStatus("idle");

    try {
      if (USE_MOCK && user) {
        const code = generateAndStoreOtp(user.email, "email");
        setMockCode(code);
      } else {
        await resendEmailVerificationOtp();
      }
      startCooldown();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to resend code. Please try again.");
      }
    }
  }

  // ─── Loading skeleton ─────────────────────────────────────────────────────

  if (isLoading || !user) {
    return (
      <Card padding="lg" shadow="sm">
        <div className="space-y-6 py-2">
          <div className="h-4 w-52 animate-pulse rounded bg-gray-200 mx-auto" />
          <div className="h-3 w-36 animate-pulse rounded bg-gray-100 mx-auto" />
          <div className="flex justify-center gap-2 pt-2">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-12 w-11 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // ─── Verified success state ───────────────────────────────────────────────

  if (otpStatus === "success") {
    return (
      <Card padding="lg" shadow="sm">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-9 w-9 text-green-500">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </span>
          <p className="text-sm font-semibold text-green-700">Email verified successfully!</p>
          <p className="text-xs text-gray-400">Redirecting you…</p>
        </div>
      </Card>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────

  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Verify your email</Card.Title>
        <Card.Description>
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-near-black">{maskEmail(user.email)}</span>
        </Card.Description>
      </Card.Header>

      <div className="space-y-5">
        {sendingOtp && (
          <Alert type="info" message="Sending your verification code…" />
        )}

        {USE_MOCK && mockCode && !sendingOtp && (
          <Alert type="info" message={`Demo mode: your code is ${mockCode}. In production this arrives by email.`} />
        )}

        <OtpInput digits={otpDigits} onChange={setOtpDigits} status={otpStatus} />

        {error && <Alert message={error} />}

        <Button
          type="button"
          fullWidth
          loading={verifying}
          disabled={!otpComplete || verifying || sendingOtp}
          onClick={handleVerify}
        >
          {verifying ? "Verifying…" : "Verify Email"}
        </Button>

        <div className="flex items-center justify-center text-xs text-gray-500">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || sendingOtp}
            className={cn(
              "font-medium transition-colors",
              resendCooldown > 0 || sendingOtp
                ? "text-gray-300 cursor-not-allowed"
                : "text-apple-blue hover:underline",
            )}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </div>
      </div>

      <Card.Footer>
        <p className="text-center text-sm text-gray-500">
          Wrong email?{" "}
          <Link href="/dashboard/settings" className="font-medium text-apple-blue hover:underline">
            Update in settings
          </Link>
        </p>
      </Card.Footer>
    </Card>
  );
}
