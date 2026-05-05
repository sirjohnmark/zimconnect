"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import {
  getMySellerProfile,
  updateMySellerProfile,
  type SellerProfile,
} from "@/lib/api/sellers";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/BackButton";

const profileSchema = z.object({
  shop_name: z
    .string()
    .min(2, "Shop name must be at least 2 characters")
    .max(100, "Shop name must be under 100 characters"),
  shop_description: z.string().optional(),
  response_time_hours: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "Enter a valid non-negative number",
    }),
});

type ProfileInput = z.infer<typeof profileSchema>;

export default function SellerProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema) });

  // ── Guards ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/dashboard/seller-profile");
      return;
    }
    if (user.role === "BUYER") {
      router.replace("/dashboard/upgrade");
      return;
    }
    if (user.role !== "SELLER") {
      router.replace("/dashboard");
      return;
    }
  }, [authLoading, user, router]);

  // ── Load profile ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading || !user || user.role !== "SELLER") return;

    getMySellerProfile()
      .then((p) => {
        setProfile(p);
        reset({
          shop_name: p.shop_name,
          shop_description: p.shop_description ?? "",
          response_time_hours: p.response_time_hours?.toString() ?? "",
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setPageLoading(false));
  }, [authLoading, user, reset]);

  // ── Submit ────────────────────────────────────────────────────────────────

  async function onSubmit(data: ProfileInput) {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateMySellerProfile({
        shop_name: data.shop_name,
        shop_description: data.shop_description || undefined,
        response_time_hours: data.response_time_hours ? Number(data.response_time_hours) : undefined,
      });
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Failed to save. Please try again.",
      );
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (authLoading || pageLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-sm text-gray-500">Could not load seller profile. Please try again later.</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-2" />
        <h1 className="text-xl font-semibold text-gray-900">Shop Profile</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Update your public shop information visible to buyers.
        </p>
      </div>

      {/* Active listings stat */}
      <Card padding="md" shadow="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Listings</p>
            <p className="text-3xl font-bold text-gray-900">{profile.active_listings_count}</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-apple-blue/10">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-apple-blue">
              <path
                fillRule="evenodd"
                d="M6 5v1H4.667a1.75 1.75 0 0 0-1.743 1.598l-.826 9.14A1.75 1.75 0 0 0 3.84 18.75h12.32a1.75 1.75 0 0 0 1.742-2.012l-.825-9.14A1.75 1.75 0 0 0 15.333 7H14V5a4 4 0 0 0-8 0Zm4-2.5A2.5 2.5 0 0 0 7.5 5v1h5V5A2.5 2.5 0 0 0 10 2.5Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
      </Card>

      {/* Edit form */}
      <Card padding="lg" shadow="sm">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {saveError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
              </svg>
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              <svg className="mt-px h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Profile updated successfully.</span>
            </div>
          )}

          <Input
            {...register("shop_name")}
            label="Shop Name"
            placeholder="e.g. Alice's Boutique"
            error={errors.shop_name?.message}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Shop Description
              <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              {...register("shop_description")}
              rows={4}
              placeholder="Tell buyers about your shop…"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-colors resize-none"
            />
          </div>

          <Input
            {...register("response_time_hours")}
            type="number"
            label="Response Time (hours)"
            placeholder="e.g. 24"
            hint="Optional — average time to respond to buyer inquiries."
            error={errors.response_time_hours?.message}
            min={0}
            step={0.5}
          />

          <Button type="submit" fullWidth loading={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
