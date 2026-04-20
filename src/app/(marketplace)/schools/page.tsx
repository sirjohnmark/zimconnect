"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { getSchools, type SchoolProfile, type SchoolType, type SchoolLevel, type SchoolCurriculum } from "@/lib/mock/schools";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<SchoolType, string> = {
  day:      "Day School",
  boarding: "Boarding",
  both:     "Day & Boarding",
};

const TYPE_COLOR: Record<SchoolType, string> = {
  day:      "bg-blue-100 text-blue-700",
  boarding: "bg-purple-100 text-purple-700",
  both:     "bg-teal-100 text-teal-700",
};

const LEVEL_LABEL: Record<SchoolLevel, string> = {
  primary:   "Primary",
  secondary: "Secondary",
  combined:  "Combined",
  tertiary:  "Tertiary",
};

const CURRICULUM_LABEL: Record<SchoolCurriculum, string> = {
  zimsec:   "ZIMSEC",
  cambridge: "Cambridge",
  both:     "ZIMSEC & Cambridge",
};

const CURRICULUM_COLOR: Record<SchoolCurriculum, string> = {
  zimsec:   "bg-apple-blue/10 text-near-black border border-apple-blue/20",
  cambridge: "bg-blue-100 text-blue-800 border border-blue-200",
  both:     "bg-violet-100 text-violet-800 border border-violet-200",
};

// ─── Image carousel ───────────────────────────────────────────────────────────

function ImageCarousel({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-gray-100">
      <Image
        src={images[idx]}
        alt={`${name} — photo ${idx + 1}`}
        fill
        className="object-cover transition-opacity duration-300"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Previous photo"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Next photo"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50")}
              />
            ))}
          </div>
        </>
      )}
      {/* Photo count badge */}
      <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
        {idx + 1}/{images.length}
      </span>
    </div>
  );
}

// ─── School card ──────────────────────────────────────────────────────────────

function SchoolCard({ school }: { school: SchoolProfile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:border-apple-blue/20 hover:shadow-md transition-all">
      <ImageCarousel images={school.images} name={school.name} />

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", TYPE_COLOR[school.type])}>
                {TYPE_LABEL[school.type]}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                {LEVEL_LABEL[school.level]}
              </span>
              {school.curriculum && (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", CURRICULUM_COLOR[school.curriculum])}>
                  {school.curriculum === "cambridge" || school.curriculum === "both" ? (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5H1.543a6.507 6.507 0 0 0 4.666 5.5 11.13 11.13 0 0 1-1.412-2.77 11.593 11.593 0 0 1-.561-2.73Zm-2.733-1.5h2.733a11.593 11.593 0 0 1 .56-2.73 11.13 11.13 0 0 1 1.413-2.77 6.507 6.507 0 0 0-4.706 5.5Zm10.181 1.5a11.593 11.593 0 0 1-.561 2.73 11.13 11.13 0 0 1-1.412 2.77 6.507 6.507 0 0 0 4.666-5.5Zm2.733-1.5a6.507 6.507 0 0 0-4.706-5.5c.54 1.337.56 2.73h2.733Z" />
                    </svg>
                  ) : null}
                  {CURRICULUM_LABEL[school.curriculum]}
                </span>
              )}
              {school.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-light-gray border border-apple-blue/20 px-2 py-0.5 text-xs font-semibold text-apple-blue">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.78 5.78-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.69l3.97-3.97a.75.75 0 0 1 1.06 1.06Z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900 leading-snug">{school.name}</h3>
            {school.tagline && <p className="text-xs text-gray-500 mt-0.5 italic">{school.tagline}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-400 shrink-0">
            <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.173 15.173 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 8c0 2.255 1.19 4.235 2.292 5.597a15.173 15.173 0 0 0 2.046 2.082 8.994 8.994 0 0 0 .19.153l.012.009ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
          </svg>
          {school.location}
        </div>

        {/* Fees */}
        {school.fees && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 space-y-1">
            <p className="text-xs font-semibold text-amber-800">School Fees</p>
            <div className="flex flex-wrap gap-3 text-xs text-amber-700">
              {school.fees.termly && (
                <span>${school.fees.termly.toLocaleString()} {school.fees.currency}/term</span>
              )}
              {school.fees.annually && (
                <span className="text-amber-600 font-semibold">${school.fees.annually.toLocaleString()} {school.fees.currency}/year</span>
              )}
            </div>
            {school.fees.notes && (
              <p className="text-[11px] text-amber-600">{school.fees.notes}</p>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <p className={cn("text-sm text-gray-600 leading-relaxed", !expanded && "line-clamp-3")}>
            {school.description}
          </p>
          {school.description.length > 120 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-medium text-apple-blue hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Contacts */}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700">Contact</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${school.contacts.phone}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-apple-blue px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M2 2.5A1.5 1.5 0 0 1 3.5 1h.928a1.5 1.5 0 0 1 1.464 1.174l.536 2.41a1.5 1.5 0 0 1-1.052 1.767l-.748.214a9.038 9.038 0 0 0 4.807 4.807l.214-.748a1.5 1.5 0 0 1 1.767-1.052l2.41.536A1.5 1.5 0 0 1 15 11.572V12.5a1.5 1.5 0 0 1-1.5 1.5H12c-5.523 0-10-4.477-10-10v-1Z" clipRule="evenodd" />
              </svg>
              {school.contacts.phone}
            </a>
            {school.contacts.whatsapp && (
              <a
                href={`https://wa.me/263${school.contacts.whatsapp.replace(/^0/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
            )}
            {school.contacts.email && (
              <a
                href={`mailto:${school.contacts.email}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-500">
                  <path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 5.066v7.184c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.066L8.682 9.59a.75.75 0 0 1-.364 0L1.5 5.066Zm13-1.61L8 8.041 1.5 3.456V3.75a.25.25 0 0 0 .25.25h12.5a.25.25 0 0 0 .25-.25v-.294Z" />
                </svg>
                Email
              </a>
            )}
            {school.contacts.website && (
              <a
                href={`https://${school.contacts.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-500">
                  <path fillRule="evenodd" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM6.56 6a8.5 8.5 0 0 1 1.44-3.25A8.5 8.5 0 0 1 9.44 6H6.56Zm-1.518 0H3.502a6.5 6.5 0 0 1 4.848-5.04A9.5 9.5 0 0 0 5.042 6Zm5.916 0a9.5 9.5 0 0 0-2.846-5.04A6.5 6.5 0 0 1 12.498 6h-1.54Zm1.54 1.5h1.54a6.5 6.5 0 0 1-4.848 5.04A9.5 9.5 0 0 0 12.498 7.5Zm-1.54 0H6.56a8.5 8.5 0 0 0 1.44 3.25A8.5 8.5 0 0 0 9.44 7.5h1.518Zm-5.916 0H3.502a9.5 9.5 0 0 0 2.846 5.04A6.5 6.5 0 0 1 1.542 7.5h1.54Z" clipRule="evenodd" />
                </svg>
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  const [schools, setSchools]         = useState<SchoolProfile[]>([]);
  const [search, setSearch]           = useState("");
  const [typeFilter, setType]         = useState<"all" | SchoolType>("all");
  const [levelFilter, setLevel]       = useState<"all" | SchoolLevel>("all");
  const [curriculumFilter, setCurric] = useState<"all" | SchoolCurriculum>("all");
  const [cityFilter, setCity]         = useState("all");
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setSchools(getSchools());
    setMounted(true);
  }, []);

  const cities = ["all", ...Array.from(new Set(schools.map((s) => s.city))).sort()];

  // Fuzzy multi-keyword scoring — split query into words, match any field
  function scoreSchool(s: SchoolProfile, words: string[]): number {
    if (words.length === 0) return 1;
    const haystack = [
      s.name, s.tagline ?? "", s.description,
      s.location, s.city,
      s.curriculum ? CURRICULUM_LABEL[s.curriculum] : "",
      s.type, s.level,
    ].join(" ").toLowerCase();
    return words.filter((w) => haystack.includes(w)).length;
  }

  const queryWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

  function passesFilters(s: SchoolProfile): boolean {
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (levelFilter !== "all" && s.level !== levelFilter) return false;
    if (cityFilter !== "all" && s.city !== cityFilter) return false;
    if (curriculumFilter !== "all") {
      if (curriculumFilter === "cambridge") return s.curriculum === "cambridge" || s.curriculum === "both";
      if (curriculumFilter === "zimsec")    return s.curriculum === "zimsec"    || s.curriculum === "both";
      return s.curriculum === curriculumFilter;
    }
    return true;
  }

  const pool = schools.filter(passesFilters).map((s) => ({ s, score: scoreSchool(s, queryWords) }));
  const exactMatches = pool.filter(({ score }) => queryWords.length === 0 || score === queryWords.length);
  const schoolsFallback = exactMatches.length === 0 && queryWords.length > 0;
  const filtered = (schoolsFallback
    ? pool.filter(({ score }) => score > 0)
    : exactMatches
  ).sort((a, b) => b.score - a.score).map(({ s }) => s);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <BackButton href="/categories" label="Categories" className="-ml-1 mb-1" />
        <h1 className="text-xl font-semibold text-gray-900">Schools Directory</h1>
        <p className="mt-0.5 text-sm text-gray-500">{schools.length} schools listed across Zimbabwe</p>
      </div>

      {/* Search & filters */}
      <div className="space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school name or location…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Type filter */}
          {(["all", "day", "boarding", "both"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                typeFilter === t
                  ? "border-apple-blue bg-apple-blue text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-apple-blue/40 hover:text-apple-blue",
              )}
            >
              {t === "all" ? "All Types" : TYPE_LABEL[t]}
            </button>
          ))}

          <div className="w-px bg-gray-200 self-stretch mx-1" />

          {/* Level filter */}
          {(["all", "primary", "secondary", "combined"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                levelFilter === l
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700",
              )}
            >
              {l === "all" ? "All Levels" : LEVEL_LABEL[l as SchoolLevel]}
            </button>
          ))}

          <div className="w-px bg-gray-200 self-stretch mx-1" />

          {/* Curriculum filter */}
          {(["all", "zimsec", "cambridge", "both"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurric(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                curriculumFilter === c
                  ? c === "cambridge"
                    ? "border-blue-600 bg-blue-700 text-white"
                    : c === "zimsec"
                    ? "border-apple-blue bg-apple-blue text-white"
                    : c === "both"
                    ? "border-violet-600 bg-violet-700 text-white"
                    : "border-gray-500 bg-gray-700 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400",
              )}
            >
              {c === "all" ? "All Curricula" : c === "both" ? "ZIMSEC & Cambridge" : CURRICULUM_LABEL[c as SchoolCurriculum]}
            </button>
          ))}

          {/* City filter */}
          {cities.length > 2 && (
            <select
              value={cityFilter}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-apple-blue"
            >
              {cities.map((c) => (
                <option key={c} value={c}>{c === "all" ? "All Cities" : c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* List your school CTA */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3.5">
        <div>
          <p className="text-sm font-bold text-blue-900">Are you a school?</p>
          <p className="text-xs text-blue-700">List your school profile, fees, photos and contacts for free.</p>
        </div>
        <Link
          href="/dashboard/schools"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all"
        >
          List My School
        </Link>
      </div>

      {/* Fallback notice */}
      {schoolsFallback && search && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 mt-0.5 text-amber-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>No exact match for <strong>&ldquo;{search}&rdquo;</strong> — showing nearest results.</span>
        </div>
      )}

      {/* Grid */}
      {!mounted ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="aspect-video bg-gray-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="h-14 w-full animate-pulse rounded-xl bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm font-semibold text-gray-700">No schools found</p>
          <p className="mt-1 text-xs text-gray-400">Try adjusting your filters or search.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {filtered.map((s) => <SchoolCard key={s.id} school={s} />)}
        </div>
      )}
    </div>
  );
}
