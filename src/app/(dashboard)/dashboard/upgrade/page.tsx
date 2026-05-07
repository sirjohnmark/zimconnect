"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import {
  submitUpgradeRequest,
  getUpgradeStatus,
  type BusinessType,
  type SellerUpgradeRequest,
} from "@/lib/api/upgrade";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";

// ─── Validation ───────────────────────────────────────────────────────────────

const step1Schema = z.object({
  business_type: z.enum(["individual", "company"], {
    error: "Please select a business type",
  }),
  business_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be under 100 characters"),
  business_description: z.string().max(500, "Description must be under 500 characters").optional(),
});

type Step1Input = z.infer<typeof step1Schema>;

// ─── File constraints ─────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_MB    = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateFile(file: File | null | undefined, required: boolean): string | null {
  if (!file) return required ? "This document is required" : null;
  if (!ACCEPTED_TYPES.includes(file.type)) return "Must be JPG, PNG, WebP, or PDF";
  if (file.size > MAX_SIZE_BYTES) return `File must be under ${MAX_SIZE_MB} MB`;
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SellerUpgradeRequest["status"] }) {
  const styles = {
    PENDING:  "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  const labels = { PENDING: "Pending Review", APPROVED: "Approved", REJECTED: "Not Approved" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
              i + 1 < current
                ? "bg-apple-blue text-white"
                : i + 1 === current
                  ? "bg-apple-blue text-white ring-2 ring-apple-blue/30"
                  : "bg-gray-100 text-gray-400",
            )}
          >
            {i + 1 < current ? (
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div className={cn("h-px w-8 transition-colors", i + 1 < current ? "bg-apple-blue" : "bg-gray-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

interface FileFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  value: File | null;
  error?: string | null;
  onChange: (file: File | null) => void;
}

function FileField({ label, hint, required, value, error, onChange }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-500">*</span>
        ) : (
          <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
        )}
      </label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
          error
            ? "border-red-300 bg-red-50 hover:bg-red-50"
            : value
              ? "border-apple-blue bg-light-gray hover:bg-light-gray"
              : "border-gray-200 bg-white hover:bg-gray-50",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            value ? "bg-apple-blue/10 text-apple-blue" : "bg-gray-100 text-gray-400",
          )}
        >
          {value ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          {value ? (
            <>
              <p className="truncate text-sm font-medium text-gray-900">{value.name}</p>
              <p className="text-xs text-gray-400">{(value.size / 1024).toFixed(0)} KB</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Click to upload</p>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Remove file"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onChange(file);
        }}
      />

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [upgradeStatus, setUpgradeStatus]   = useState<SellerUpgradeRequest | null>(null);
  const [loadingStatus, setLoadingStatus]   = useState(true);
  const [step, setStep]                     = useState<1 | 2>(1);
  const [step1Data, setStep1Data]           = useState<Step1Input | null>(null);

  // Document files
  const [nationalId,          setNationalId]          = useState<File | null>(null);
  const [passport,            setPassport]            = useState<File | null>(null);
  const [companyRegistration, setCompanyRegistration] = useState<File | null>(null);

  // Document errors
  const [idDocGroupError,          setIdDocGroupError]          = useState<string | null>(null);
  const [nationalIdError,          setNationalIdError]          = useState<string | null>(null);
  const [passportError,            setPassportError]            = useState<string | null>(null);
  const [companyRegistrationError, setCompanyRegistrationError] = useState<string | null>(null);

  const [submitError,   setSubmitError]   = useState<string | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const isCompany = step1Data?.business_type === "company";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Input>({ resolver: zodResolver(step1Schema) });

  const watchedType = watch("business_type");

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login?redirect=/dashboard/upgrade"); return; }
    if (user.role === "SELLER") { router.replace("/dashboard/seller-profile"); return; }
    if (user.role !== "BUYER") { router.replace("/dashboard"); return; }

    getUpgradeStatus()
      .then(setUpgradeStatus)
      .catch(() => setUpgradeStatus(null))
      .finally(() => setLoadingStatus(false));
  }, [isLoading, user, router]);

  function onStep1Submit(data: Step1Input) {
    setStep1Data(data);
    setStep(2);
    setSubmitError(null);
  }

  async function onStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!step1Data) return;

    // At least one identity document (National ID or Passport) is required.
    const groupErr = !nationalId && !passport
      ? "Please upload at least one identity document — National ID or Passport."
      : null;
    setIdDocGroupError(groupErr);

    // Validate format/size for any file that was provided (not required individually).
    const nidErr  = validateFile(nationalId, false);
    const passErr = validateFile(passport, false);
    const compErr = validateFile(companyRegistration, isCompany);

    setNationalIdError(nidErr);
    setPassportError(passErr);
    setCompanyRegistrationError(compErr);

    if (groupErr || nidErr || passErr || compErr) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await submitUpgradeRequest({
        business_type:        step1Data.business_type as BusinessType,
        business_name:        step1Data.business_name,
        business_description: step1Data.business_description,
        national_id:          nationalId ?? undefined,
        passport:             passport ?? undefined,
        company_registration: companyRegistration ?? undefined,
      });
      setUpgradeStatus(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError("You already have a pending upgrade request.");
        getUpgradeStatus().then(setUpgradeStatus).catch(() => null);
      } else if (err instanceof ApiError && err.status === 400) {
        setSubmitError("Please verify your email address before applying to become a seller.");
      } else {
        setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Loading skeleton ───────────────────────────────────────────────────────

  if (isLoading || loadingStatus) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  // ─── Status cards ───────────────────────────────────────────────────────────

  const statusCard = upgradeStatus?.status === "PENDING" ? (
    <Card padding="md" shadow="sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-gray-900">Request under review</p>
          <p className="mt-0.5 text-sm text-gray-500">
            Your application for <strong>{upgradeStatus.business_name}</strong> is being reviewed. We&apos;ll notify you by email once it&apos;s processed.
          </p>
        </div>
      </div>
    </Card>
  ) : upgradeStatus?.status === "APPROVED" ? (
    <Card padding="md" shadow="sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-gray-900">You&apos;re now a Seller!</p>
          <p className="mt-0.5 text-sm text-gray-500">
            Your seller account <strong>{upgradeStatus.business_name}</strong> has been approved.
          </p>
          <Link href="/dashboard/seller-profile" className="mt-2 inline-block text-sm font-semibold text-apple-blue hover:underline">
            Set up your shop profile →
          </Link>
        </div>
      </div>
    </Card>
  ) : null;

  // ─── Step 1 form ────────────────────────────────────────────────────────────

  const step1Form = (
    <form onSubmit={handleSubmit(onStep1Submit)} noValidate className="space-y-5">
      {/* Business type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Account type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["individual", "company"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue("business_type", type, { shouldValidate: true })}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all",
                watchedType === type
                  ? "border-apple-blue bg-light-gray ring-2 ring-apple-blue/20"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              <span className={cn("text-sm font-semibold capitalize", watchedType === type ? "text-apple-blue" : "text-gray-800")}>
                {type}
              </span>
              <span className="text-xs text-gray-400">
                {type === "individual" ? "Sole trader / freelancer" : "Registered business"}
              </span>
            </button>
          ))}
        </div>
        {errors.business_type && (
          <p className="text-xs text-red-600">{errors.business_type.message}</p>
        )}
        {/* Hidden input to register field */}
        <input type="hidden" {...register("business_type")} />
      </div>

      <Input
        {...register("business_name")}
        label="Business Name"
        placeholder={watchedType === "company" ? "e.g. Acme Enterprises Ltd" : "e.g. Alice's Boutique"}
        error={errors.business_name?.message}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Business Description
          <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          {...register("business_description")}
          rows={3}
          placeholder="Briefly describe what you sell…"
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-colors resize-none"
        />
        {errors.business_description && (
          <p className="text-xs text-red-600">{errors.business_description.message}</p>
        )}
      </div>

      <Button type="submit" fullWidth>
        Continue to Documents
      </Button>
    </form>
  );

  // ─── Step 2 form ────────────────────────────────────────────────────────────

  const step2Form = (
    <form onSubmit={onStep2Submit} noValidate className="space-y-5">
      {submitError && <ErrorAlert message={submitError} />}

      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Upload clear photos or scans. Accepted formats: JPG, PNG, WebP, PDF. Max {MAX_SIZE_MB} MB each.
      </div>

      {/* Identity document group — at least one required */}
      <div className="space-y-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          Upload <strong>at least one</strong> identity document — National ID <em>or</em> Passport.
        </div>

        {idDocGroupError && (
          <p className="text-xs text-red-600">{idDocGroupError}</p>
        )}

        <FileField
          label="National ID"
          hint="Front and back of your national identity document"
          value={nationalId}
          error={nationalIdError}
          onChange={(f) => { setNationalId(f); setNationalIdError(null); if (f) setIdDocGroupError(null); }}
        />

        <FileField
          label="Passport"
          hint="Photo page of your passport"
          value={passport}
          error={passportError}
          onChange={(f) => { setPassport(f); setPassportError(null); if (f) setIdDocGroupError(null); }}
        />
      </div>

      {isCompany && (
        <FileField
          label="Company Registration Certificate"
          hint="Certificate of incorporation or business registration"
          required
          value={companyRegistration}
          error={companyRegistrationError}
          onChange={(f) => { setCompanyRegistration(f); setCompanyRegistrationError(null); }}
        />
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => { setStep(1); setSubmitError(null); }}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" loading={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit Application"}
        </Button>
      </div>
    </form>
  );

  // ─── Rejected state ─────────────────────────────────────────────────────────

  const rejectedContent = upgradeStatus?.status === "REJECTED" ? (
    <>
      <Card padding="md" shadow="sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-gray-900">Application not approved</p>
            {upgradeStatus.rejection_reason && (
              <p className="mt-0.5 text-sm text-gray-500">Reason: {upgradeStatus.rejection_reason}</p>
            )}
            <p className="mt-1 text-sm text-gray-400">You may resubmit a new application below.</p>
          </div>
        </div>
      </Card>

      <Card padding="md" shadow="sm">
        <div className="mb-5 flex items-center justify-between">
          <StepIndicator current={step} total={2} />
          <span className="text-xs text-gray-400">Step {step} of 2</span>
        </div>
        {step === 1 ? step1Form : step2Form}
      </Card>
    </>
  ) : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-2" />
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Become a Seller</h1>
          {upgradeStatus && <StatusBadge status={upgradeStatus.status} />}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Set up your seller account to start listing items and earning money on Sanganai.
        </p>
      </div>

      {statusCard}
      {rejectedContent}

      {!upgradeStatus && (
        <Card padding="md" shadow="sm">
          <div className="mb-5 flex items-center justify-between">
            <StepIndicator current={step} total={2} />
            <span className="text-xs text-gray-400">Step {step} of 2</span>
          </div>
          {step === 1 ? step1Form : step2Form}
        </Card>
      )}
    </div>
  );
}
