"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { postJob, type JobType, type JobIndustry } from "@/lib/api/jobs";
import { VerificationGate } from "@/components/ui/VerificationGate";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "full-time",   label: "Full-time" },
  { value: "part-time",   label: "Part-time" },
  { value: "contract",    label: "Contract" },
  { value: "internship",  label: "Internship" },
  { value: "remote",      label: "Remote (only)" },
];

const INDUSTRIES: { value: JobIndustry; label: string }[] = [
  { value: "technology",     label: "Technology & IT" },
  { value: "finance",        label: "Finance & Accounting" },
  { value: "engineering",    label: "Engineering" },
  { value: "healthcare",     label: "Healthcare & Medical" },
  { value: "education",      label: "Education & Training" },
  { value: "sales-marketing",label: "Sales & Marketing" },
  { value: "logistics",      label: "Logistics & Transport" },
  { value: "construction",   label: "Construction & Property" },
  { value: "hospitality",    label: "Hospitality & Tourism" },
  { value: "agriculture",    label: "Agriculture & Farming" },
  { value: "legal",          label: "Legal & Compliance" },
  { value: "media",          label: "Media & Communications" },
  { value: "ngo",            label: "NGO & Development" },
  { value: "manufacturing",  label: "Manufacturing & Production" },
  { value: "other",          label: "Other" },
];

// ─── Shared field wrapper ─────────────────────────────────────────────────────

function Field({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error  && <p className="text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = (error?: string) => cn(
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400",
  "focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors",
  error ? "border-red-400" : "border-gray-300",
);

// ─── Requirements / Benefits dynamic list ─────────────────────────────────────

function TagList({
  label, hint, items, onChange, placeholder,
}: {
  label: string; hint?: string; items: string[];
  onChange: (items: string[]) => void; placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const val = draft.trim();
    if (!val || items.includes(val)) return;
    onChange([...items, val]);
    setDraft("");
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-apple-blue/10 text-apple-blue">
                <svg viewBox="0 0 12 12" fill="currentColor" className="h-2.5 w-2.5">
                  <path d="M9.765 3.205a.75.75 0 0 1 .03 1.06l-4.25 4.5a.75.75 0 0 1-1.085.006L2.21 6.52a.75.75 0 0 1 1.08-1.04l1.865 1.934 3.75-3.977a.75.75 0 0 1 1.06-.232Z" />
                </svg>
              </span>
              <span className="flex-1 text-sm text-gray-700">{item}</span>
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L6.94 8l-1.72 1.72a.75.75 0 1 0 1.06 1.06L8 9.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L9.06 8l1.72-1.72a.75.75 0 0 0-1.06-1.06L8 6.94 6.28 5.22Z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="rounded-lg bg-apple-blue px-3 py-2 text-sm font-semibold text-white hover:bg-apple-blue disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<string, string>>;

export default function PostJobPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [company,      setCompany]      = useState("");
  const [title,        setTitle]        = useState("");
  const [industry,     setIndustry]     = useState<JobIndustry | "">("");
  const [jobType,      setJobType]      = useState<JobType>("full-time");
  const [location,     setLocation]     = useState("");
  const [isRemote,     setIsRemote]     = useState(false);
  const [salaryOn,     setSalaryOn]     = useState(false);
  const [salaryMin,    setSalaryMin]    = useState("");
  const [salaryMax,    setSalaryMax]    = useState("");
  const [description,  setDescription]  = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefits,     setBenefits]     = useState<string[]>([]);
  const [howToApply,   setHowToApply]   = useState("");
  const [deadline,     setDeadline]     = useState("");
  const [errors,       setErrors]       = useState<FormErrors>({});
  const [submitting,   setSubmitting]   = useState(false);
  const [success,      setSuccess]      = useState(false);

  if (!user) return null;

  const isMock     = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  const isVerified = isMock || user.is_verified || user.email_verified;

  function validate(): boolean {
    const e: FormErrors = {};
    if (!company.trim())     e.company     = "Company name is required.";
    if (!title.trim())       e.title       = "Job title is required.";
    if (title.trim().length < 5) e.title   = "Title must be at least 5 characters.";
    if (!location.trim() && !isRemote) e.location = "Location is required (or mark as remote).";
    if (!description.trim()) e.description = "Job description is required.";
    if (description.trim().length < 50) e.description = "Description must be at least 50 characters.";
    if (requirements.length === 0) e.requirements = "Add at least one requirement.";
    if (salaryOn) {
      if (!salaryMin || isNaN(Number(salaryMin)) || Number(salaryMin) <= 0)
        e.salaryMin = "Enter a valid minimum salary.";
      if (!salaryMax || isNaN(Number(salaryMax)) || Number(salaryMax) <= 0)
        e.salaryMax = "Enter a valid maximum salary.";
      if (Number(salaryMin) > Number(salaryMax))
        e.salaryMin = "Minimum salary cannot exceed maximum.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !validate()) return;
    setSubmitting(true);
    try {
      await postJob({
        title:            title.trim(),
        company:          company.trim(),
        employerId:       String(user.id),
        location:         location.trim() || "Remote",
        remote:           isRemote,
        type:             jobType,
        industry:         industry || undefined,
        salary:           salaryOn ? { min: Number(salaryMin), max: Number(salaryMax), currency: "USD" } : undefined,
        description:      description.trim(),
        requirements,
        benefits:         benefits.length > 0 ? benefits : undefined,
        howToApply:       howToApply.trim() || undefined,
        deadline:         deadline || undefined,
        status:           "open",
        verifiedEmployer: isVerified,
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/jobs"), 1500);
    } catch {
      setErrors((prev) => ({ ...prev, submit: "Failed to post job. Please try again." }));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isVerified) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <BackButton href="/dashboard/jobs" label="Back to Jobs" className="-ml-1 mb-2" />
          <h1 className="text-xl font-bold text-gray-900">Post a Job</h1>
        </div>
        <VerificationGate action="post a job" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-apple-blue/10">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-9 w-9 text-apple-blue">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-lg font-bold text-gray-900">Job posted successfully!</p>
        <p className="text-sm text-gray-500">Redirecting to your job dashboard…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <BackButton href="/dashboard/jobs" label="Back to Jobs" className="-ml-1 mb-2" />
        <h1 className="text-xl font-bold text-gray-900">Post a Job</h1>
        <p className="mt-1 text-sm text-gray-500">Fill in the details below to publish your job listing.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">

        {/* ── Section: About the role ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">About the Role</h2>

          <Field label="Company / Organisation Name" required error={errors.company}>
            <input
              type="text"
              value={company}
              onChange={(e) => { setCompany(e.target.value); setErrors((v) => ({ ...v, company: undefined })); }}
              placeholder="e.g. TechZim Solutions, Zimbuilds Group"
              className={inputCls(errors.company)}
            />
          </Field>

          <Field label="Job Title" required error={errors.title}>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((v) => ({ ...v, title: undefined })); }}
              placeholder="e.g. Senior Software Engineer, Accounts Manager"
              className={inputCls(errors.title)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry / Sector">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as JobIndustry | "")}
                className={inputCls()}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </Field>

            <Field label="Job Type" required>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className={inputCls()}
              >
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Section: Location ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Location</h2>

          <Field label="City / Town" required={!isRemote} error={errors.location}
            hint="Enter the city or write 'Nationwide' for roles that travel.">
            <input
              type="text"
              value={location}
              onChange={(e) => { setLocation(e.target.value); setErrors((v) => ({ ...v, location: undefined })); }}
              placeholder="e.g. Harare, Bulawayo, Nationwide"
              disabled={isRemote}
              className={cn(inputCls(errors.location), isRemote && "opacity-40 cursor-not-allowed")}
            />
          </Field>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Remote / Work from home</p>
              <p className="text-xs text-gray-400">Toggle on if this role can be done remotely</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isRemote}
              onClick={() => setIsRemote((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2",
                isRemote ? "bg-apple-blue" : "bg-gray-200",
              )}
            >
              <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200", isRemote ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
        </div>

        {/* ── Section: Salary ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900">Salary / Compensation</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{salaryOn ? "Specified" : "Not disclosed"}</span>
              <button
                type="button"
                role="switch"
                aria-checked={salaryOn}
                onClick={() => setSalaryOn((v) => !v)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2",
                  salaryOn ? "bg-apple-blue" : "bg-gray-200",
                )}
              >
                <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200", salaryOn ? "translate-x-5" : "translate-x-0")} />
              </button>
            </div>
          </div>

          {salaryOn ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Minimum (USD/month)" required error={errors.salaryMin}>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => { setSalaryMin(e.target.value); setErrors((v) => ({ ...v, salaryMin: undefined })); }}
                  placeholder="e.g. 800"
                  min="0"
                  className={inputCls(errors.salaryMin)}
                />
              </Field>
              <Field label="Maximum (USD/month)" required error={errors.salaryMax}>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => { setSalaryMax(e.target.value); setErrors((v) => ({ ...v, salaryMax: undefined })); }}
                  placeholder="e.g. 1200"
                  min="0"
                  className={inputCls(errors.salaryMax)}
                />
              </Field>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Salary will show as "Negotiable" on the listing.</p>
          )}
        </div>

        {/* ── Section: Job description ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Job Description</h2>

          <Field label="Full Description" required error={errors.description}
            hint="Describe the role, responsibilities, and what a typical day looks like. Min. 50 characters.">
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors((v) => ({ ...v, description: undefined })); }}
                rows={6}
                maxLength={3000}
                placeholder="Describe the role, responsibilities, team, and what makes this opportunity exciting…"
                className={cn(inputCls(errors.description), "resize-none")}
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-400">{description.length}/3000</span>
            </div>
          </Field>

          <div className={cn(errors.requirements ? "ring-1 ring-red-400 rounded-xl p-3 -m-3" : "")}>
            <TagList
              label="Requirements & Qualifications *"
              hint='Press Enter or click "Add" after each item. e.g. "BSc Computer Science", "3+ years React"'
              items={requirements}
              onChange={(items) => { setRequirements(items); setErrors((v) => ({ ...v, requirements: undefined })); }}
              placeholder="e.g. 3+ years experience in finance"
            />
            {errors.requirements && <p className="mt-1.5 text-xs text-red-600">{errors.requirements}</p>}
          </div>

          <TagList
            label="Benefits & Perks (optional)"
            hint='e.g. "Medical aid", "Annual bonus", "Company vehicle"'
            items={benefits}
            onChange={setBenefits}
            placeholder="e.g. Medical aid cover"
          />
        </div>

        {/* ── Section: Application details ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Application Details</h2>

          <Field label="How to Apply"
            hint="Enter an email address or a URL. Leave blank to use your Sanganai inbox.">
            <input
              type="text"
              value={howToApply}
              onChange={(e) => setHowToApply(e.target.value)}
              placeholder="e.g. careers@company.co.zw  or  https://company.com/apply"
              className={inputCls()}
            />
          </Field>

          <Field label="Application Deadline" hint="Leave blank if the role is open until filled.">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={inputCls()}
            />
          </Field>
        </div>

        {/* ── Preview card ── */}
        {title && company && (
          <div className="rounded-xl border border-apple-blue/20 bg-light-gray p-4 space-y-1">
            <p className="text-xs font-semibold text-apple-blue uppercase tracking-wide">Preview</p>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <p className="text-xs text-gray-600">{company} · {isRemote ? "Remote" : location || "—"} · {JOB_TYPES.find(t => t.value === jobType)?.label}</p>
            {salaryOn && salaryMin && salaryMax && (
              <p className="text-xs text-apple-blue font-medium">USD {Number(salaryMin).toLocaleString()} – {Number(salaryMax).toLocaleString()} / month</p>
            )}
          </div>
        )}

        {/* ── Submit ── */}
        {errors.submit && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {errors.submit}
          </div>
        )}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-apple-blue px-5 py-3 text-sm font-semibold text-white hover:bg-apple-blue disabled:opacity-60 transition-colors"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Publishing…
              </>
            ) : "Publish Job Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
