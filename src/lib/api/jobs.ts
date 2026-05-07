import { api, ApiError, NetworkError } from "./client";
import { getAccessToken } from "@/lib/auth/auth";

// ─── Frontend types (shape the pages expect) ─────────────────────────────────

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type JobType = "full-time" | "part-time" | "contract" | "internship" | "remote";
export type JobIndustry =
  | "technology" | "finance" | "engineering" | "healthcare" | "education"
  | "sales-marketing" | "logistics" | "construction" | "hospitality"
  | "agriculture" | "legal" | "media" | "ngo" | "manufacturing" | "other";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  employerId: string;
  location: string;
  remote: boolean;
  type: JobType;
  industry?: JobIndustry;
  salary?: { min: number; max: number; currency: string };
  description: string;
  requirements: string[];
  benefits?: string[];
  howToApply?: string;
  postedAt: string;
  deadline?: string;
  status: "open" | "closed" | "filled";
  applicants: number;
  verifiedEmployer: boolean;
}

export interface CvProfile {
  id: string;
  seekerId: string;
  seekerName: string;
  seekerInitial: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  summary: string;
  cvFile?: string;
  uploadedAt: string;
  available: boolean;
  status: string;
}

export interface Report {
  id?: string;
  reporterId: string;
  reporterRole: "employer" | "seeker";
  targetId: string;
  targetType: "job" | "cv" | "user";
  reason: string;
  details?: string;
  submittedAt?: string;
  resolved?: boolean;
}

export interface VerificationRequest {
  userId: string;
  docType: "national_id" | "company_registry" | "tax_clearance" | "other";
  docFile: string;
  submittedAt: string;
  status: VerificationStatus;
  note?: string;
}

// ─── Backend types (Django snake_case) ───────────────────────────────────────

interface BackendJob {
  id: number;
  title: string;
  company: string;
  employer: { id: number; username: string; is_verified?: boolean } | null;
  employer_id?: number;
  location: string;
  is_remote: boolean;
  job_type: string;
  industry: string | null;
  salary_min: string | null;
  salary_max: string | null;
  salary_currency: string;
  description: string;
  requirements: string[];
  benefits: string[] | null;
  how_to_apply: string | null;
  deadline: string | null;
  status: string;
  applicants_count: number;
  is_employer_verified: boolean;
  created_at: string;
}

interface BackendCv {
  id: number;
  user: { id: number; first_name: string; last_name: string; username: string };
  title: string;
  location: string;
  experience: string;
  skills: string[];
  summary: string;
  cv_file: string | null;
  availability_status: string;
  is_available: boolean;
  created_at: string;
}

interface BackendVerification {
  user?: number;
  doc_type: string;
  doc_file: string;
  submitted_at: string;
  status: string;
  note?: string;
}

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

const JOB_TYPE_MAP: Record<string, JobType> = {
  FULL_TIME: "full-time", full_time: "full-time", "full-time": "full-time",
  PART_TIME: "part-time", part_time: "part-time", "part-time": "part-time",
  CONTRACT:  "contract",  contract:  "contract",
  INTERNSHIP:"internship",internship:"internship",
  REMOTE:    "remote",    remote:    "remote",
};

const INDUSTRY_MAP: Record<string, JobIndustry> = {
  TECHNOLOGY: "technology", technology: "technology",
  FINANCE: "finance", finance: "finance",
  ENGINEERING: "engineering", engineering: "engineering",
  HEALTHCARE: "healthcare", healthcare: "healthcare",
  EDUCATION: "education", education: "education",
  SALES_MARKETING: "sales-marketing", "sales-marketing": "sales-marketing",
  LOGISTICS: "logistics", logistics: "logistics",
  CONSTRUCTION: "construction", construction: "construction",
  HOSPITALITY: "hospitality", hospitality: "hospitality",
  AGRICULTURE: "agriculture", agriculture: "agriculture",
  LEGAL: "legal", legal: "legal",
  MEDIA: "media", media: "media",
  NGO: "ngo", ngo: "ngo",
  MANUFACTURING: "manufacturing", manufacturing: "manufacturing",
  OTHER: "other", other: "other",
};

function mapJob(b: BackendJob): JobListing {
  return {
    id: String(b.id),
    title: b.title,
    company: b.company,
    employerId: b.employer ? String(b.employer.id) : String(b.employer_id ?? ""),
    location: b.location,
    remote: b.is_remote,
    type: JOB_TYPE_MAP[b.job_type] ?? "full-time",
    industry: b.industry ? INDUSTRY_MAP[b.industry] : undefined,
    salary: b.salary_min
      ? { min: Number(b.salary_min), max: Number(b.salary_max ?? b.salary_min), currency: b.salary_currency || "USD" }
      : undefined,
    description: b.description,
    requirements: b.requirements ?? [],
    benefits: b.benefits?.length ? b.benefits : undefined,
    howToApply: b.how_to_apply ?? undefined,
    postedAt: b.created_at,
    deadline: b.deadline ?? undefined,
    status: (b.status.toLowerCase() as "open" | "closed" | "filled") ?? "open",
    applicants: b.applicants_count ?? 0,
    verifiedEmployer: b.is_employer_verified ?? false,
  };
}

function mapCv(b: BackendCv): CvProfile {
  const fullName = `${b.user.first_name} ${b.user.last_name}`.trim() || b.user.username;
  return {
    id: String(b.id),
    seekerId: String(b.user.id),
    seekerName: fullName,
    seekerInitial: fullName.charAt(0).toUpperCase(),
    title: b.title,
    location: b.location,
    experience: b.experience,
    skills: b.skills ?? [],
    summary: b.summary,
    cvFile: b.cv_file ?? undefined,
    uploadedAt: b.created_at,
    available: b.is_available,
    status: b.availability_status,
  };
}

function mapVerification(b: BackendVerification, userId: string): VerificationRequest {
  return {
    userId,
    docType: b.doc_type as VerificationRequest["docType"],
    docFile: b.doc_file,
    submittedAt: b.submitted_at,
    status: b.status as VerificationStatus,
    note: b.note,
  };
}

// ─── Jobs API ─────────────────────────────────────────────────────────────────

export interface GetJobsParams {
  search?: string;
  status?: string;
  job_type?: string;
  industry?: string;
  location?: string;
  page?: number;
  page_size?: number;
}

export async function getJobs(params: GetJobsParams = {}): Promise<JobListing[]> {
  const data = await api.get<Paginated<BackendJob>>("/api/v1/jobs", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
  return data.results.map(mapJob);
}

/** Authenticated user's own job postings (employer view). */
export async function getMyJobs(): Promise<JobListing[]> {
  const data = await api.get<Paginated<BackendJob>>("/api/v1/jobs/my-jobs");
  return data.results.map(mapJob);
}

/** Alias kept for call-site compatibility — ignores employerId, uses auth. */
export async function getEmployerJobs(_employerId: string): Promise<JobListing[]> {
  return getMyJobs();
}

export async function postJob(
  job: Omit<JobListing, "id" | "postedAt" | "applicants">
): Promise<JobListing> {
  const payload = {
    title:           job.title,
    company:         job.company,
    location:        job.location || "Remote",
    is_remote:       job.remote,
    job_type:        job.type.replace("-", "_").toUpperCase(),
    industry:        job.industry ? job.industry.replace("-", "_").toUpperCase() : null,
    salary_min:      job.salary?.min ?? null,
    salary_max:      job.salary?.max ?? null,
    salary_currency: job.salary?.currency ?? "USD",
    description:     job.description,
    requirements:    job.requirements,
    benefits:        job.benefits ?? [],
    how_to_apply:    job.howToApply ?? null,
    deadline:        job.deadline ?? null,
    status:          job.status.toUpperCase(),
  };
  const raw = await api.post<BackendJob>("/api/v1/jobs", payload);
  return mapJob(raw);
}

export async function updateJobStatus(jobId: string, status: "open" | "closed" | "filled"): Promise<void> {
  await api.patch<BackendJob>(`/api/v1/jobs/${jobId}`, { status: status.toUpperCase() });
}

export async function deleteJob(jobId: string): Promise<void> {
  await api.delete<void>(`/api/v1/jobs/${jobId}`);
}

// ─── CVs API ──────────────────────────────────────────────────────────────────

export async function getCvs(params: Record<string, unknown> = {}): Promise<CvProfile[]> {
  const data = await api.get<Paginated<BackendCv>>("/api/v1/jobs/cvs", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
  return data.results.map(mapCv);
}

export async function getMyCv(_seekerId?: string): Promise<CvProfile | undefined> {
  try {
    const raw = await api.get<BackendCv>("/api/v1/jobs/cvs/mine");
    return mapCv(raw);
  } catch {
    return undefined;
  }
}

/**
 * Create or update the current user's CV profile.
 * Pass `file` to attach or replace the CV document.
 * Uses multipart/form-data when a file is provided, JSON otherwise.
 */
export async function uploadCv(
  data: Omit<CvProfile, "id" | "uploadedAt">,
  file?: File,
): Promise<CvProfile> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  if (file) {
    const form = new FormData();
    form.append("title",               data.title);
    form.append("location",            data.location);
    form.append("experience",          data.experience);
    form.append("summary",             data.summary);
    form.append("availability_status", data.status);
    form.append("is_available",        String(data.available));
    form.append("skills",              JSON.stringify(data.skills));
    form.append("cv_file",             file);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(`/api/v1/jobs/cvs/mine/`, {
        method: "PUT",
        headers,
        body:   form,
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;
        const msg  = (body.detail as string) ?? (body.message as string) ?? "Failed to save CV.";
        throw new ApiError(res.status, res.statusText, msg);
      }
      const raw = await res.json() as BackendCv;
      return mapCv(raw);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new NetworkError("Upload timed out. Please try again.", err);
      }
      throw new NetworkError("Unable to connect to server.", err);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const raw = await api.put<BackendCv>("/api/v1/jobs/cvs/mine", {
    title:               data.title,
    location:            data.location,
    experience:          data.experience,
    summary:             data.summary,
    availability_status: data.status,
    is_available:        data.available,
    skills:              data.skills,
  });
  return mapCv(raw);
}

// ─── Reports API ─────────────────────────────────────────────────────────────

export async function submitReport(
  report: Pick<Report, "reporterRole" | "targetId" | "targetType" | "reason" | "details">
): Promise<void> {
  await api.post<void>("/api/v1/jobs/reports", {
    reporter_role: report.reporterRole,
    target_id:     report.targetId,
    target_type:   report.targetType,
    reason:        report.reason,
    details:       report.details ?? null,
  });
}

// ─── Verification API ─────────────────────────────────────────────────────────

export async function getVerification(_userId?: string): Promise<VerificationRequest | undefined> {
  try {
    const raw = await api.get<BackendVerification>("/api/v1/auth/verification");
    return mapVerification(raw, _userId ?? "");
  } catch {
    return undefined;
  }
}

export async function submitVerification(data: {
  docType: VerificationRequest["docType"];
  file: File;
}): Promise<void> {
  const token = getAccessToken();
  const form  = new FormData();
  form.append("doc_type", data.docType);
  form.append("doc_file",  data.file);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`/api/v1/auth/verification/`, {
      method: "POST",
      headers,
      body:   form,
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      const msg  = (body.detail as string) ?? (body.message as string) ?? "Verification submission failed.";
      throw new ApiError(res.status, res.statusText, msg);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new NetworkError("Upload timed out. Please try again.", err);
    }
    throw new NetworkError("Unable to connect to server.", err);
  } finally {
    clearTimeout(timeoutId);
  }
}
