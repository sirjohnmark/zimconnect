import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPublicSellerProfile } from "@/lib/api/sellers";
import type { Metadata } from "next";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCity(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ username: string }>;
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  try {
    const profile = await getPublicSellerProfile(username);
    return {
      title: `${profile.shop_name} — Sanganai`,
      description:
        profile.shop_description ??
        `Shop by ${profile.shop_name} on Sanganai. Browse ${profile.active_listings_count} active listing${profile.active_listings_count !== 1 ? "s" : ""}.`,
      openGraph: {
        title: `${profile.shop_name} on Sanganai`,
        description:
          profile.shop_description ??
          `Check out ${profile.shop_name} on Sanganai.`,
      },
    };
  } catch {
    return {
      title: "Seller Not Found — Sanganai",
      description: "The seller you are looking for could not be found.",
    };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium text-gray-500">{label}</span>
      <span className="text-gray-900">{children}</span>
    </div>
  );
}

export default async function SellerProfilePage({ params }: Props) {
  const { username } = await params;

  let profile;
  try {
    profile = await getPublicSellerProfile(username);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Back */}
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
            clipRule="evenodd"
          />
        </svg>
        Back to listings
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-apple-blue/10 ring-4 ring-white shadow-md">
            {profile.user.profile_picture ? (
              <Image
                src={profile.user.profile_picture}
                alt={profile.shop_name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-apple-blue">
                {profile.shop_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{profile.shop_name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">@{profile.user.username}</p>
            {profile.shop_description && (
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {profile.shop_description}
              </p>
            )}
          </div>
        </div>

        {/* Contact */}
        <Link
          href="/inbox"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
            <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
          </svg>
          Contact Seller
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{profile.active_listings_count}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-400">
            Active Listings
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatDate(profile.user.member_since)}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-400">
            Member Since
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatCity(profile.user.location)}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-400">
            Location
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
          {profile.response_time_hours != null ? (
            <p className="text-2xl font-bold text-gray-900">
              {profile.response_time_hours < 1
                ? "< 1h"
                : profile.response_time_hours < 24
                  ? `${Math.round(profile.response_time_hours)}h`
                  : `${Math.round(profile.response_time_hours / 24)}d`}
            </p>
          ) : (
            <p className="text-2xl font-bold text-gray-300">—</p>
          )}
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-400">
            Response Time
          </p>
        </div>
      </div>
    </div>
  );
}
