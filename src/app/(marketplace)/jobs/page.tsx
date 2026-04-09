"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { ReportModal } from "@/components/jobs/ReportModal";
import { getJobs, getCvs, type JobListing, type CvProfile } from "@/lib/mock/jobs";
import { cn } from "@/lib/utils";

// ─── Disclaimer ───────────────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex gap-2.5 items-start">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 mt-0.5 text-amber-500">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
      </svg>
      <span>
        <strong>Disclaimer:</strong> Sanganai does not guarantee the accuracy of job listings or the legitimacy of employers. Always verify an employer&apos;s identity before sharing personal information or attending interviews. Verified employers are marked with a <span className="font-semibold text-emerald-700">✓ Verified</span> badge. Report suspicious listings using the Report button.
      </span>
    </div>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  "full-time":  "bg-emerald-100 text-emerald-700",
  "part-time":  "bg-blue-100 text-blue-700",
  "contract":   "bg-purple-100 text-purple-700",
  "internship": "bg-amber-100 text-amber-700",
  "remote":     "bg-teal-100 text-teal-700",
};

function JobCard({ job }: { job: JobListing }) {
  const daysLeft = job.deadline
    ? Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", TYPE_COLORS[job.type] ?? "bg-gray-100 text-gray-600")}>
              {job.type}
            </span>
            {job.verifiedEmployer && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.78 5.78-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.69l3.97-3.97a.75.75 0 0 1 1.06 1.06Z" clipRule="evenodd" />
                </svg>
                Verified Employer
              </span>
            )}
            {daysLeft !== null && daysLeft <= 5 && daysLeft > 0 && (
              <span className="text-xs text-red-500 font-medium">{daysLeft}d left</span>
            )}
            {daysLeft === 0 && <span className="text-xs text-red-500 font-medium">Deadline today</span>}
          </div>
          <h3 className="text-sm font-bold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
        </div>

        <ReportModal targetId={job.id} targetType="job" reporterRole="seeker" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-400">
            <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.173 15.173 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 8c0 2.255 1.19 4.235 2.292 5.597a15.173 15.173 0 0 0 2.046 2.082 8.994 8.994 0 0 0 .19.153l.012.009ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
          </svg>
          {job.location}
        </span>
        {job.salary && (
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            ${job.salary.min.toLocaleString()}–${job.salary.max.toLocaleString()} {job.salary.currency}/mo
          </span>
        )}
        <span>{job.applicants} applicant{job.applicants !== 1 ? "s" : ""}</span>
      </div>

      <p className="mt-2.5 text-xs text-gray-500 line-clamp-2">{job.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.requirements.slice(0, 4).map((r) => (
          <span key={r} className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-0.5 text-xs text-gray-600">{r}</span>
        ))}
        {job.requirements.length > 4 && (
          <span className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-0.5 text-xs text-gray-400">+{job.requirements.length - 4} more</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {job.howToApply ? (
          <a
            href={job.howToApply.includes("@") ? `mailto:${job.howToApply}` : job.howToApply.startsWith("http") ? job.howToApply : `https://${job.howToApply}`}
            target={job.howToApply.includes("@") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.97] transition-all"
          >
            Apply Now
          </a>
        ) : (
          <Link
            href="/dashboard/messages"
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.97] transition-all"
          >
            Apply Now
          </Link>
        )}
        <Link href="/dashboard/messages" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Message
        </Link>
      </div>
    </div>
  );
}

// ─── CV card (for employers browsing) ────────────────────────────────────────

function CvCard({ cv }: { cv: CvProfile }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-lg font-bold">
          {cv.seekerInitial}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-gray-900">{cv.seekerName}</p>
              <p className="text-sm text-gray-500">{cv.title}</p>
            </div>
            <ReportModal targetId={cv.id} targetType="cv" reporterRole="employer" />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-gray-500">
            <span>{cv.location}</span>
            <span>·</span>
            <span>{cv.experience} exp.</span>
            <span>·</span>
            <span className={cn("font-semibold", cv.available ? "text-emerald-600" : "text-gray-400")}>
              {cv.status}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500 line-clamp-2">{cv.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {cv.skills.map((s) => (
          <span key={s} className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs text-blue-700">{s}</span>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          href="/dashboard/messages"
          className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700 active:scale-[0.97] transition-all"
        >
          Contact Candidate
        </Link>
        {cv.cvFile && (
          <span className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
            View CV
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [tab, setTab]       = useState<"jobs" | "cvs">("jobs");
  const [jobs, setJobs]     = useState<JobListing[]>([]);
  const [cvs, setCvs]       = useState<CvProfile[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "full-time" | "part-time" | "contract" | "internship" | "remote">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setJobs(getJobs());
    setCvs(getCvs());
    setMounted(true);
  }, []);

  const queryWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

  function scoreJob(j: JobListing): number {
    if (queryWords.length === 0) return queryWords.length || 1;
    const haystack = [
      j.title, j.company, j.location,
      j.description, j.industry ?? "",
      j.type, j.requirements.join(" "),
      j.benefits?.join(" ") ?? "",
    ].join(" ").toLowerCase();
    return queryWords.filter((w) => haystack.includes(w)).length;
  }

  function scoreCv(c: CvProfile): number {
    if (queryWords.length === 0) return 1;
    const haystack = [
      c.title, c.seekerName, c.location,
      c.summary, c.skills.join(" "), c.status,
    ].join(" ").toLowerCase();
    return queryWords.filter((w) => haystack.includes(w)).length;
  }

  const jobPool = jobs
    .filter((j) => j.status === "open" && (filter === "all" || j.type === filter))
    .map((j) => ({ j, score: scoreJob(j) }));

  const exactJobs = jobPool.filter(({ score }) => queryWords.length === 0 || score === queryWords.length);
  const jobsFallback = exactJobs.length === 0 && queryWords.length > 0;
  const filteredJobs = (jobsFallback
    ? jobPool.filter(({ score }) => score > 0)
    : exactJobs
  ).sort((a, b) => b.score - a.score).map(({ j }) => j);

  const cvPool = cvs.map((c) => ({ c, score: scoreCv(c) }));
  const exactCvs = cvPool.filter(({ score }) => queryWords.length === 0 || score === queryWords.length);
  const cvsFallback = exactCvs.length === 0 && queryWords.length > 0;
  const filteredCvs = (cvsFallback
    ? cvPool.filter(({ score }) => score > 0)
    : exactCvs
  ).sort((a, b) => b.score - a.score).map(({ c }) => c);

  return (
    <div className="space-y-5">
      <div>
        <BackButton href="/categories" label="Categories" className="-ml-1 mb-1" />
        <h1 className="text-xl font-semibold text-gray-900">Job Vacancies</h1>
        <p className="mt-0.5 text-sm text-gray-500">{jobs.filter(j => j.status === "open").length} open positions</p>
      </div>

      <Disclaimer />

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1 w-fit">
        {([["jobs", "Browse Jobs"], ["cvs", "Browse CVs"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "jobs" ? "Search job title or company…" : "Search by name or skill…"}
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        {tab === "jobs" && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
          </select>
        )}
        <Link
          href="/dashboard/jobs"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.97] transition-all whitespace-nowrap"
        >
          {tab === "jobs" ? "Post a Job" : "Upload My CV"}
        </Link>
      </div>

      {/* Fallback notice */}
      {search && ((tab === "jobs" && jobsFallback) || (tab === "cvs" && cvsFallback)) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 mt-0.5 text-amber-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>No exact match for <strong>&ldquo;{search}&rdquo;</strong> — showing nearest results.</span>
        </div>
      )}

      {/* Content */}
      {!mounted ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white h-48 animate-pulse" />
          ))}
        </div>
      ) : tab === "jobs" ? (
        filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
            <p className="text-sm font-semibold text-gray-700">No jobs found</p>
            <p className="mt-1 text-xs text-gray-400">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )
      ) : (
        filteredCvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
            <p className="text-sm font-semibold text-gray-700">No CVs found</p>
            <p className="mt-1 text-xs text-gray-400">Try a different search.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredCvs.map((cv) => <CvCard key={cv.id} cv={cv} />)}
          </div>
        )
      )}

      {/* Bottom employer CTA */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-800">Are you an employer?</p>
          <p className="text-xs text-emerald-700 mt-0.5">Post jobs, browse CVs, and get verified to build trust with candidates.</p>
        </div>
        <Link href="/dashboard/jobs" className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all">
          Employer Dashboard →
        </Link>
      </div>
    </div>
  );
}
