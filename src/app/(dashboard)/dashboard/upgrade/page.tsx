"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import {
  submitUpgradeRequest,
  getUpgradeStatus,
  type SellerUpgradeRequest,
} from "@/lib/api/upgrade";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/BackButton";

const upgradeSchema = z.object({
  business_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be under 100 characters"),
  business_description: z.string().optional(),
});

type UpgradeInput = z.infer<typeof upgradeSchema>;

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

export default function UpgradePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [upgradeStatus, setUpgradeStatus] = useState<SellerUpgradeRequest | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpgradeInput>({ resolver: zodResolver(upgradeSchema) });

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role === "SELLER") { router.replace("/dashboard/seller-profile"); return; }
    if (user.role !== "BUYER") { router.replace("/dashboard"); return; }

    getUpgradeStatus()
      .then(setUpgradeStatus)
      .catch(() => setUpgradeStatus(null))
      .finally(() => setLoadingStatus(false));
  }, [isLoading, user, router]);

  async function onSubmit(data: UpgradeInput) {
    setSubmitError(null);
    try {
      const result = await submitUpgradeRequest(data.business_name, data.business_description);
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
    }
  }

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

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {submitError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      <Input
        {...register("business_name")}
        label="Business Name"
        placeholder="e.g. Alice's Boutique"
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
      </div>

      <Button type="submit" fullWidth loading={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Apply to Become a Seller"}
      </Button>
    </form>
  );

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

      {upgradeStatus?.status === "PENDING" && (
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
      )}

      {upgradeStatus?.status === "APPROVED" && (
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
      )}

      {upgradeStatus?.status === "REJECTED" && (
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
                  <p className="mt-0.5 text-sm text-gray-500">
                    Reason: {upgradeStatus.rejection_reason}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-400">You may resubmit a new application below.</p>
              </div>
            </div>
          </Card>
          {form}
        </>
      )}

      {!upgradeStatus && form}
    </div>
  );
}
