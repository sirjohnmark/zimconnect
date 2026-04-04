"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { generateAndStoreOtp, verifyOtp } from "@/lib/auth/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Details", "Verify", "Confirm"];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done    ? "bg-emerald-600 text-white"
                  : active ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                  : "bg-gray-100 text-gray-400",
                )}
              >
                {done ? (
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                ) : step}
              </span>
              <span className={cn("text-[10px] font-medium", active ? "text-emerald-700" : "text-gray-400")}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px flex-1 mx-2 mt-[-12px] transition-colors", done ? "bg-emerald-400" : "bg-gray-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────

function Alert({ message, type = "error" }: { message: string; type?: "error" | "info" | "success" }) {
  const styles = {
    error:   "border-red-200 bg-red-50 text-red-700",
    info:    "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
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

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  function handleChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      const next = digits.map((d, i) => (i === idx ? "" : d)).join("").trimEnd();
      onChange(next);
      return;
    }
    // handle paste
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6);
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    const next = digits.map((d, i) => (i === idx ? raw : d)).join("");
    onChange(next);
    if (idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-12 w-11 rounded-xl border text-center text-xl font-bold tracking-widest",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors",
            digits[i] ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-white text-gray-800",
          )}
        />
      ))}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { register: registerAuth } = useAuthContext();
  const redirectTo   = searchParams.get("redirect") ?? "/dashboard";

  // multi-step state
  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [formData, setFormData]     = useState<RegisterInput | null>(null);
  const [verifyMethod, setMethod]   = useState<"email" | "phone">("email");
  const [otpCode, setOtpCode]       = useState("");
  const [sentCode, setSentCode]     = useState<string | null>(null); // mock: show user the code
  const [otpError, setOtpError]     = useState<string | null>(null);
  const [formError, setFormError]   = useState<string | null>(null);
  const [sending, setSending]       = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const [resendCooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const watchedPhone = watch("phone");
  const watchedEmail = watch("email");

  // ── Step 1: collect details ───────────────────────────────────────────────

  function onDetailsSubmit(data: RegisterInput) {
    setFormError(null);
    setFormData(data);

    // Decide default verify method based on what user filled
    if (data.phone) setMethod("phone");
    else setMethod("email");

    setStep(2);
  }

  // ── Step 2: send OTP ──────────────────────────────────────────────────────

  async function handleSendCode() {
    if (!formData) return;
    setSending(true);
    setOtpError(null);

    const contact = verifyMethod === "email" ? formData.email : (formData.phone ?? "");
    const code    = generateAndStoreOtp(contact, verifyMethod);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    // In mock mode we reveal the code so the user can complete registration.
    // In production this would actually send an email/SMS — never expose the code.
    setSentCode(code);
    setSending(false);
    setStep(3);

    // 60s resend cooldown
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0 || !formData) return;
    const contact = verifyMethod === "email" ? formData.email : (formData.phone ?? "");
    const code    = generateAndStoreOtp(contact, verifyMethod);
    setSentCode(code);
    setOtpCode("");
    setOtpError(null);
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  // ── Step 3: verify OTP + create account ──────────────────────────────────

  async function handleVerifyAndRegister() {
    if (!formData || otpCode.length < 6) return;
    setVerifying(true);
    setOtpError(null);

    const result = verifyOtp(otpCode);
    if (!result.valid) {
      setOtpError(result.reason ?? "Invalid code.");
      setVerifying(false);
      return;
    }

    try {
      await registerAuth(formData);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError("An account with this email already exists.");
        setStep(1);
      } else {
        setOtpError("Account creation failed. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Create an account</Card.Title>
        <Card.Description>Join ZimConnect today — it&apos;s free</Card.Description>
      </Card.Header>

      <Steps current={step} />

      {/* ── Step 1: Account details ── */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onDetailsSubmit)} noValidate className="space-y-4">
          {formError && <Alert message={formError} />}

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
            label="Email Address"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            required
          />
          <Input
            {...register("phone")}
            type="tel"
            label="Phone Number"
            placeholder="e.g. 0771234567"
            autoComplete="tel"
            hint="Used to verify your account via SMS. Optional if verifying by email."
            error={errors.phone?.message}
          />
          <Input
            {...register("password")}
            type="password"
            label="Password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
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
            Continue
          </Button>
        </form>
      )}

      {/* ── Step 2: Choose method ── */}
      {step === 2 && formData && (
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            Choose how you&apos;d like to verify your account. We&apos;ll send a 6-digit code.
          </p>

          <div className="space-y-2.5">
            {/* Email option */}
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors",
                verifyMethod === "email"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              <span className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                verifyMethod === "email" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400",
              )}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                  <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Verify by Email</p>
                <p className="text-xs text-gray-500 truncate">Code sent to {formData.email}</p>
              </div>
              {verifyMethod === "email" && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-600 shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Phone option */}
            <button
              type="button"
              onClick={() => setMethod("phone")}
              disabled={!formData.phone}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors",
                !formData.phone ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                : verifyMethod === "phone" ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              <span className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                verifyMethod === "phone" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400",
              )}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Verify by SMS</p>
                <p className="text-xs text-gray-500 truncate">
                  {formData.phone ? `Code sent to ${formData.phone}` : "Add a phone number above to use SMS"}
                </p>
              </div>
              {verifyMethod === "phone" && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-600 shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <Button
              type="button"
              className="flex-1"
              loading={sending}
              onClick={handleSendCode}
            >
              {sending ? "Sending…" : "Send Code"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Enter OTP ── */}
      {step === 3 && formData && (
        <div className="space-y-5">
          <p className="text-sm text-gray-600 text-center">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-gray-900">
              {verifyMethod === "email" ? formData.email : formData.phone}
            </span>
          </p>

          {/* Dev helper — shows the mock OTP code */}
          {sentCode && (
            <Alert
              type="info"
              message={`Demo mode: your verification code is ${sentCode}. In production this would be sent by ${verifyMethod === "email" ? "email" : "SMS"}.`}
            />
          )}

          <OtpInput value={otpCode} onChange={setOtpCode} />

          {otpError && <Alert message={otpError} />}

          <Button
            type="button"
            fullWidth
            loading={verifying}
            onClick={handleVerifyAndRegister}
            disabled={otpCode.length < 6}
          >
            {verifying ? "Verifying…" : "Verify & Create Account"}
          </Button>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <button
              type="button"
              onClick={() => { setStep(2); setOtpCode(""); setOtpError(null); }}
              className="hover:text-gray-700 hover:underline"
            >
              ← Change method
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={cn(
                "font-medium transition-colors",
                resendCooldown > 0 ? "text-gray-300 cursor-not-allowed" : "text-emerald-600 hover:underline",
              )}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

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
