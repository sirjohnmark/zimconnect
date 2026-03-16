"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Phone, BadgeCheck, MapPin, ExternalLink } from "lucide-react";
import { buildWhatsAppUrl, maskPhone, revealPhone } from "@/lib/utils/contact";
import type { SellerProfile } from "@/types";

interface SellerContactCardProps {
  seller: SellerProfile;
  listingTitle: string;
}

export default function SellerContactCard({
  seller,
  listingTitle,
}: SellerContactCardProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  const initial = (seller.display_name || seller.username)[0].toUpperCase();
  const whatsappUrl = seller.phone
    ? buildWhatsAppUrl(seller.phone, listingTitle)
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Seller</h3>

      {/* ─── Seller identity ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-100">
          {seller.avatar_url ? (
            <Image
              src={seller.avatar_url}
              alt={seller.display_name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-brand-600">
              {initial}
            </span>
          )}
        </div>

        {/* Name + username + verified */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 truncate">
              {seller.display_name}
            </span>
            {seller.is_verified && (
              <BadgeCheck
                className="w-4 h-4 text-brand-600 shrink-0"
                aria-label="Verified seller"
              />
            )}
          </div>
          <p className="text-sm text-slate-500">@{seller.username}</p>
        </div>
      </div>

      {/* Location */}
      {seller.location && (
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {seller.location}
        </div>
      )}

      {/* ─── Contact actions ─────────────────────────────────────────────── */}
      <div className="space-y-2 pt-1">
        {/* WhatsApp */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1ebe5b] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        ) : (
          <p className="text-center text-xs text-slate-400 py-2">
            No WhatsApp contact available
          </p>
        )}

        {/* Phone reveal */}
        {seller.phone && (
          <button
            onClick={() => setPhoneRevealed(true)}
            disabled={phoneRevealed}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:cursor-default"
            aria-label={phoneRevealed ? "Phone number revealed" : "Reveal phone number"}
          >
            <Phone className="w-4 h-4 shrink-0" />
            {phoneRevealed
              ? revealPhone(seller.phone)
              : maskPhone(seller.phone)}
          </button>
        )}
      </div>

      {/* ─── Profile link ────────────────────────────────────────────────── */}
      <Link
        href={`/profile/${seller.username}`}
        className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 transition-colors pt-1"
      >
        View seller profile
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
