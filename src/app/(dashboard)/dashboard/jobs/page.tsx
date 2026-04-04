"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { ReportModal } from "@/components/jobs/ReportModal";
import {
  getJobs,
  getCvs,
  getVerification,
  submitVerification,
  uploadCv,
  getMyCv,
  type JobListing,
  type CvProfile,
  type VerificationRequest,
} from "@/lib/mock/jobs";
import { cn } from "@/lib/utils";

// ─── Verification banner ──────────────────────────────────────────────────────

function VerificationSection({ userId }: { userId: string }) {
  const [verification, setVerification] = useState<VerificationRequest | undefined>(undefined);
  const [docType, setDocType] = useState<VerificationRequest["docType"]>("national_id");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVerification(getVerification(userId));
  }, [userId]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileName) return;
    setSubmitting(true);
    submitVerification({ userId, docType, docFile: fileName });
    setVerification(getVerification(userId));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (verification?.status === "verified") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-emerald-800">Verified Employer</p>
          <p className="text-xs text-emerald-600">Your account is verified. A badge is shown on all your job listings.</p>
        </div>
      </div>
    );
  }

  if (verification?.status === "pending" || submitted) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-800">Verification Pending</p>
        <p className="text-xs text-amber-700 mt-1">Your documents are under review. This usually takes 1–2 business days. You&apos;ll be notified once approved.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-gray-900">Get Verified as an Employer</p>
          <p className="text-xs text-gray-500 mt-0.5">Verified employers get a badge on all their listings and higher trust from candidates. Upload your National ID or company registration documents.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as VerificationRequest["docType"])}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="national_id">National ID</option>
            <option value="company_registry">Company Registry Certificate (CR14 / CR6)</option>
            <option value="tax_clearance">Tax Clearance Certificate (ZIMRA)</option>
            <option value="other">Other Official Document</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Upload Document *</label>
          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors",
              fileName ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50/50",
            )}
          >
            {fileName ? (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-emerald-600">
                  <path fillRule="evenodd" d="M3 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm3.293-7.707a1 1 0 0 1 1.414 0L9 10.586V3a1 1 0 1 1 2 0v7.586l1.293-1.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-semibold text-emerald-700">{fileName}</p>
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-gray-400">
                  <path fillRule="evenodd" d="M3 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm3.293-7.707a1 1 0 0 1 1.414 0L9 10.586V3a1 1 0 1 1 2 0v7.586l1.293-1.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-gray-500">Click to upload PDF, JPG or PNG</p>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFile} />
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
          Your documents are encrypted and used only for verification. They will not be shared publicly.
        </div>

        <button
          type="submit"
          disabled={!fileName || submitting}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Submitting…" : "Submit for Verification"}
        </button>
      </form>
    </div>
  );
}

// ─── CV upload section ────────────────────────────────────────────────────────

function CvUploadSection({ userId, userName }: { userId: string; userName: string }) {
  const [cv, setCv]           = useState<CvProfile | undefined>(undefined);
  const [title, setTitle]     = useState("");
  const [location, setLoc]    = useState("");
  const [experience, setExp]  = useState("");
  const [skills, setSkills]   = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus]   = useState("Actively looking");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const existing = getMyCv(userId);
    if (existing) {
      setCv(existing);
      setTitle(existing.title);
      setLoc(existing.location);
      setExp(existing.experience);
      setSkills(existing.skills.join(", "));
      setSummary(existing.summary);
      setStatus(existing.status);
      if (existing.cvFile) setFileName(existing.cvFile);
    }
  }, [userId]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const updated = uploadCv({
      seekerId: userId,
      seekerName: userName,
      seekerInitial: userName.charAt(0).toUpperCase(),
      title: title.trim(),
      location: location.trim(),
      experience: experience.trim(),
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      summary: summary.trim(),
      cvFile: fileName || undefined,
      available: status !== "Not currently available",
      status,
    });
    setCv(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6 space-y-5">
      <div>
        <p className="text-sm font-bold text-gray-900">{cv ? "Update My CV" : "Upload My CV"}</p>
        <p className="text-xs text-gray-500 mt-0.5">Your CV is visible to verified employers browsing candidates.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Job Title / Role *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Software Engineer" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Location</label>
            <input value={location} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Harare" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Years of Experience</label>
            <input value={experience} onChange={(e) => setExp(e.target.value)} placeholder="e.g. 3 years" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Availability Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>Actively looking</option>
              <option>Open to offers</option>
              <option>Not currently available</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Skills (comma-separated)</label>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Node.js, PostgreSQL" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Professional Summary</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="A brief overview of your experience and what you're looking for…" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Attach CV Document (PDF)</label>
          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 cursor-pointer transition-colors",
              fileName ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-emerald-300",
            )}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className={cn("h-5 w-5 shrink-0", fileName ? "text-emerald-600" : "text-gray-400")}>
              <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Z" />
            </svg>
            <p className={cn("text-xs", fileName ? "text-emerald-700 font-semibold" : "text-gray-500")}>
              {fileName || "Click to attach your CV (PDF, max 5MB)"}
            </p>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={handleFile} />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving…" : cv ? "Update CV" : "Publish CV"}
          </button>
          {saved && <span className="text-xs font-semibold text-emerald-600">✓ CV updated</span>}
        </div>
      </form>
    </div>
  );
}

// ─── Job card (employer view) ─────────────────────────────────────────────────

function MyJobCard({ job }: { job: JobListing }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{job.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{job.location} · {job.applicants} applicant{job.applicants !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
          job.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500",
        )}>
          {job.status}
        </span>
        <ReportModal targetId={job.id} targetType="job" reporterRole="employer" label="Flag" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab]     = useState<"employer" | "seeker">("seeker");
  const [jobs, setJobs]   = useState<JobListing[]>([]);
  const [cvs, setCvs]     = useState<CvProfile[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setJobs(getJobs());
    setCvs(getCvs());
    setMounted(true);
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-2" />
        <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>
        <p className="mt-1 text-sm text-gray-500">Manage job postings, your CV, or verify your employer account.</p>
      </div>

      {/* Role tabs */}
      <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1 w-fit">
        {([["seeker", "I'm a Job Seeker"], ["employer", "I'm an Employer"]] as const).map(([key, label]) => (
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

      {tab === "seeker" ? (
        <>
          <CvUploadSection userId={user.id} userName={user.name} />

          {/* My applications */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
            <p className="text-sm font-bold text-gray-900">My Applications</p>
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
              <p className="text-sm font-medium text-gray-500">No applications yet</p>
              <Link href="/jobs" className="mt-2 inline-block text-xs text-emerald-600 hover:underline">Browse open jobs →</Link>
            </div>
          </div>
        </>
      ) : (
        <>
          <VerificationSection userId={user.id} />

          {/* Post a job CTA */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">My Job Postings</p>
              <Link
                href="/listings?category=jobs"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all"
              >
                + Post a Job
              </Link>
            </div>
            {!mounted ? (
              <div className="space-y-2">
                {[1, 2].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-gray-100" />)}
              </div>
            ) : jobs.filter(j => j.employerId === "emp1").length > 0 ? (
              <div className="space-y-2">
                {jobs.filter(j => j.employerId === "emp1").map((job) => <MyJobCard key={job.id} job={job} />)}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
                <p className="text-sm text-gray-500">No job postings yet</p>
              </div>
            )}
          </div>

          {/* Browse CVs summary */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">Browse Candidate CVs</p>
              <Link href="/jobs" className="text-xs text-emerald-600 hover:underline font-medium">View all →</Link>
            </div>
            <div className="space-y-2">
              {cvs.slice(0, 3).map((cv) => (
                <div key={cv.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {cv.seekerInitial}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{cv.seekerName}</p>
                    <p className="text-xs text-gray-500">{cv.title} · {cv.location}</p>
                  </div>
                  <span className={cn("text-xs font-medium shrink-0", cv.available ? "text-emerald-600" : "text-gray-400")}>
                    {cv.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
