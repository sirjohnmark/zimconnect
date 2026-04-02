import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about ZimConnect — Zimbabwe's trusted marketplace connecting buyers and sellers across the country.",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "50K+",  label: "Active Listings"   },
  { value: "12K+",  label: "Verified Sellers"  },
  { value: "8",     label: "Categories"         },
  { value: "10+",   label: "Cities Covered"    },
];

const VALUES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Trust & Safety",
    description: "Every seller is verified and all listings reviewed. We protect both buyers and sellers with transparent profiles and secure communication.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: "Community First",
    description: "Built for Zimbabweans, by Zimbabweans. We understand local needs — from USD pricing to WhatsApp-first communication.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    title: "Fast & Simple",
    description: "List in under 2 minutes. No complicated forms, no waiting for approval. Your listing goes live instantly and reaches thousands of buyers.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3" />
      </svg>
    ),
    title: "Mobile First",
    description: "Designed for smartphones. Browse, save, message sellers, and manage your listings from anywhere — on any device.",
  },
];

const TEAM = [
  { name: "Ian Marware",        role: "Co-Founder & CEO",      initial: "I", color: "bg-emerald-100 text-emerald-700" },
  { name: "Strive Chitakatira", role: "Co-Founder & CEO",     initial: "S", color: "bg-blue-100 text-blue-700"    },
  { name: "Rudo Maziwisa",     role: "Head of Product",       initial: "R", color: "bg-purple-100 text-purple-700" },
  { name: "Farai Ncube",       role: "Head of Operations",    initial: "F", color: "bg-amber-100 text-amber-700"   },
  { name: "Chiedza Mpofu",     role: "Marketing Lead",        initial: "C", color: "bg-rose-100 text-rose-700"     },
  { name: "Tinashe Dube",      role: "Customer Success",      initial: "T", color: "bg-teal-100 text-teal-700"     },
];

const MILESTONES = [
  { year: "2022", event: "ZimConnect founded in Harare with a vision to digitise Zimbabwe's informal markets." },
  { year: "2023", event: "Launched beta with 500 listings. Expanded to Bulawayo and Mutare within 6 months." },
  { year: "2024", event: "Crossed 10,000 active listings. Introduced verified seller badges and WhatsApp integration." },
  { year: "2025", event: "Reached 50,000 listings across 10+ cities. Launched mobile app and in-app messaging." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white py-16 sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)] opacity-30"
        />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-6">
            🇿🇼 Made in Zimbabwe
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Connecting Zimbabwe,<br className="hidden sm:block" /> one listing at a time
          </h1>
          <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
            ZimConnect is Zimbabwe&apos;s trusted marketplace where anyone can buy, sell, and discover — from a phone in Mbare to a laptop in Borrowdale.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/listings" className="rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.97] transition-all">
              Browse Listings
            </Link>
            <Link href="/contact" className="rounded-xl border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-[0.97] transition-all">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-emerald-600">{value}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Our Mission</p>
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl leading-snug">
                Making commerce accessible to every Zimbabwean
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                We believe every Zimbabwean deserves a fair, simple, and safe way to trade. Whether you&apos;re a small business owner in Mutare, a student in Gweru selling a laptop, or a family in Harare looking for affordable furniture — ZimConnect is for you.
              </p>
              <p className="mt-4 text-gray-500 leading-relaxed">
                We built ZimConnect because we saw how much buying and selling was happening on scattered WhatsApp groups and Facebook pages, with no safety net and no search. We wanted to fix that.
              </p>
            </div>
            {/* Visual placeholder */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-white">
              <p className="text-sm font-semibold text-emerald-200 uppercase tracking-wider mb-4">Our vision</p>
              <p className="text-xl font-bold leading-snug">
                &ldquo;A Zimbabwe where every individual and business can reach any buyer — a single trusted space where buyers and sellers meet, trade, and grow together, instantly, safely, and for free.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">I</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">S</span>
                <div>
                  <p className="text-sm font-semibold">Ian Marware &amp; Strive Chitakatira</p>
                  <p className="text-xs text-emerald-200">Co-Founders &amp; CEOs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">What we stand for</p>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Our core values</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {VALUES.map(({ icon, title, description }) => (
              <div key={title} className="flex gap-4 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  {icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Our story</p>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">How we got here</h2>
          </div>
          <div className="relative border-l-2 border-emerald-100 pl-8 space-y-10">
            {MILESTONES.map(({ year, event }) => (
              <div key={year} className="relative">
                <span className="absolute -left-[2.6rem] flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white ring-4 ring-white">
                  {year.slice(2)}
                </span>
                <p className="text-xs font-semibold text-emerald-600 mb-1">{year}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">The people</p>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Meet our team</h2>
            <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">A small, passionate team based in Harare, building the future of commerce in Zimbabwe.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {TEAM.map(({ name, role, initial, color }) => (
              <div key={name} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
                <span className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold mb-3 ${color}`}>
                  {initial}
                </span>
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="mt-0.5 text-xs text-gray-400">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Ready to join ZimConnect?</h2>
          <p className="mt-4 text-gray-500">Whether you&apos;re buying or selling, it&apos;s free and takes less than 2 minutes to get started.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-sm">
              Create Free Account
            </Link>
            <Link href="/contact" className="rounded-xl border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-[0.97] transition-all">
              Talk to Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
