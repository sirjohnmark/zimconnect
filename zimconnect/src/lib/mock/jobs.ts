// ─── Types ────────────────────────────────────────────────────────────────────

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Employer {
  id: string;
  name: string;
  company: string;
  logo?: string;
  verificationStatus: VerificationStatus;
  verificationDoc?: string; // base64 or filename
}

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
  howToApply?: string; // email or URL
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
  title: string; // e.g. "Software Engineer"
  location: string;
  experience: string; // e.g. "3 years"
  skills: string[];
  summary: string;
  cvFile?: string; // filename or base64
  uploadedAt: string;
  available: boolean;
  status: string; // e.g. "Actively looking", "Open to offers"
}

export interface ApplicationStatus {
  id: string;
  jobId: string;
  seekerId: string;
  seekerName: string;
  employerUpdate: string;   // employer's latest status message
  seekerUpdate: string;     // seeker's latest status message
  stage: "applied" | "reviewing" | "shortlisted" | "interview" | "offered" | "rejected" | "withdrawn";
  updatedAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterRole: "employer" | "seeker";
  targetId: string;           // jobId or cvId
  targetType: "job" | "cv" | "user";
  reason: string;
  details?: string;
  submittedAt: string;
  resolved: boolean;
}

export interface VerificationRequest {
  userId: string;
  docType: "national_id" | "company_registry" | "tax_clearance" | "other";
  docFile: string; // filename or base64
  submittedAt: string;
  status: VerificationStatus;
  note?: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const JOBS_KEY       = "sanganai_jobs";
const CVS_KEY        = "sanganai_cvs";
const STATUSES_KEY   = "sanganai_job_statuses";
const REPORTS_KEY    = "sanganai_reports";
const VERIFY_KEY     = "sanganai_verifications";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_JOBS: JobListing[] = [
  {
    id: "j1",
    title: "Software Engineer (React / Node.js)",
    company: "TechZim Solutions",
    employerId: "emp1",
    location: "Harare",
    remote: true,
    type: "full-time",
    industry: "technology",
    salary: { min: 1200, max: 1800, currency: "USD" },
    description: "We are looking for a skilled Software Engineer to join our growing team. You will build and maintain web applications for local and international clients.",
    requirements: ["3+ years React", "Node.js / Express", "PostgreSQL", "REST APIs", "Git"],
    howToApply: "careers@techzim.co.zw",
    postedAt: "2026-03-28T08:00:00Z",
    deadline: "2026-04-30T23:59:00Z",
    status: "open",
    applicants: 14,
    verifiedEmployer: true,
  },
  {
    id: "j2",
    title: "Accounts Manager",
    company: "Fin Eagle Zimbabwe",
    employerId: "emp2",
    location: "Bulawayo",
    remote: false,
    type: "full-time",
    industry: "finance",
    salary: { min: 800, max: 1100, currency: "USD" },
    description: "Manage client accounts, prepare financial reports, and liaise with auditors. CPA or ACCA qualification required.",
    requirements: ["CPA / ACCA", "5+ years finance", "Pastel / Sage", "Excel"],
    postedAt: "2026-03-30T09:00:00Z",
    deadline: "2026-04-20T23:59:00Z",
    status: "open",
    applicants: 8,
    verifiedEmployer: true,
  },
  {
    id: "j3",
    title: "Marketing & Social Media Intern",
    company: "Vibe Media ZW",
    employerId: "emp3",
    location: "Harare",
    remote: false,
    type: "internship",
    industry: "sales-marketing",
    salary: { min: 200, max: 300, currency: "USD" },
    description: "Support the marketing team with social media content creation, scheduling, and analytics. Great opportunity for recent graduates.",
    requirements: ["Degree in Marketing / Comms", "Social media savvy", "Canva / Photoshop a plus"],
    postedAt: "2026-04-01T10:00:00Z",
    status: "open",
    applicants: 22,
    verifiedEmployer: false,
  },
  {
    id: "j4",
    title: "Driver — Class 2 (6-tonne truck)",
    company: "Swift Logistics Zimbabwe",
    employerId: "emp4",
    location: "Harare",
    remote: false,
    type: "full-time",
    industry: "logistics",
    salary: { min: 400, max: 600, currency: "USD" },
    description: "Experienced Class 2 driver needed for inter-city deliveries. Clean driving record required.",
    requirements: ["Class 2 licence", "3+ years driving", "Defensive driving certificate"],
    postedAt: "2026-04-02T07:00:00Z",
    status: "open",
    applicants: 5,
    verifiedEmployer: true,
  },
  {
    id: "j5",
    title: "Civil Engineer — Infrastructure Projects",
    company: "Zimbuilds Group",
    employerId: "emp5",
    location: "Mutare",
    remote: false,
    type: "contract",
    industry: "engineering",
    salary: { min: 1500, max: 2500, currency: "USD" },
    description: "6-month contract for road and bridge construction oversight. AutoCAD and project management experience required.",
    requirements: ["BSc Civil Engineering", "AutoCAD", "5+ years site experience", "Valid EIZ membership"],
    postedAt: "2026-03-25T08:00:00Z",
    deadline: "2026-04-15T23:59:00Z",
    status: "open",
    applicants: 3,
    verifiedEmployer: true,
  },
];

const SEED_CVS: CvProfile[] = [
  {
    id: "cv1",
    seekerId: "user1",
    seekerName: "Rutendo Chikara",
    seekerInitial: "R",
    title: "Frontend Developer",
    location: "Harare",
    experience: "4 years",
    skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Figma"],
    summary: "Passionate frontend developer with 4 years building responsive web apps. Open to remote and hybrid roles.",
    uploadedAt: "2026-04-01T12:00:00Z",
    available: true,
    status: "Actively looking",
  },
  {
    id: "cv2",
    seekerId: "user2",
    seekerName: "Blessing Mhuri",
    seekerInitial: "B",
    title: "Accountant (ACCA Finalist)",
    location: "Bulawayo",
    experience: "3 years",
    skills: ["Pastel", "Sage Evolution", "Excel", "VAT", "Payroll"],
    summary: "Detail-oriented accountant working towards ACCA qualification. Strong background in SME financial management.",
    uploadedAt: "2026-04-02T09:00:00Z",
    available: true,
    status: "Open to offers",
  },
  {
    id: "cv3",
    seekerId: "user3",
    seekerName: "Tatenda Mushore",
    seekerInitial: "T",
    title: "Digital Marketing Specialist",
    location: "Harare",
    experience: "2 years",
    skills: ["Facebook Ads", "Google Ads", "Canva", "Instagram", "Analytics"],
    summary: "Creative marketer with hands-on experience running paid ad campaigns for FMCG brands in Zimbabwe.",
    uploadedAt: "2026-03-30T15:00:00Z",
    available: false,
    status: "Not currently available",
  },
  {
    id: "cv4",
    seekerId: "user4",
    seekerName: "Farai Dzingai",
    seekerInitial: "F",
    title: "Civil & Structural Engineer",
    location: "Harare",
    experience: "7 years",
    skills: ["AutoCAD", "STAAD Pro", "Project Management", "EIZ Member", "Site Supervision"],
    summary: "Registered Civil Engineer with extensive experience in road, housing, and commercial infrastructure projects.",
    uploadedAt: "2026-04-01T08:30:00Z",
    available: true,
    status: "Actively looking",
  },
];

const SEED_STATUSES: ApplicationStatus[] = [
  {
    id: "st1",
    jobId: "j1",
    seekerId: "me",
    seekerName: "You",
    employerUpdate: "Application received. We will be in touch shortly.",
    seekerUpdate: "Applied and looking forward to hearing from you.",
    stage: "applied",
    updatedAt: "2026-04-02T10:00:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : seed;
  } catch { return seed; }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Jobs API ─────────────────────────────────────────────────────────────────

export function getJobs(): JobListing[] {
  return read<JobListing>(JOBS_KEY, SEED_JOBS);
}

export function getJob(id: string): JobListing | undefined {
  return getJobs().find((j) => j.id === id);
}

export function getEmployerJobs(employerId: string): JobListing[] {
  return getJobs().filter((j) => j.employerId === employerId);
}

export function postJob(job: Omit<JobListing, "id" | "postedAt" | "applicants">): JobListing {
  const jobs = getJobs();
  const newJob: JobListing = {
    ...job,
    id: `j-${Date.now()}`,
    postedAt: new Date().toISOString(),
    applicants: 0,
  };
  jobs.unshift(newJob);
  write(JOBS_KEY, jobs);
  return newJob;
}

export function updateJobStatus(jobId: string, status: JobListing["status"]): void {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx < 0) return;
  jobs[idx] = { ...jobs[idx], status };
  write(JOBS_KEY, jobs);
}

export function deleteJob(jobId: string): void {
  const jobs = getJobs().filter((j) => j.id !== jobId);
  write(JOBS_KEY, jobs);
}

// ─── CVs API ─────────────────────────────────────────────────────────────────

export function getCvs(): CvProfile[] {
  return read<CvProfile>(CVS_KEY, SEED_CVS);
}

export function uploadCv(cv: Omit<CvProfile, "id" | "uploadedAt">): CvProfile {
  const cvs = getCvs();
  const existing = cvs.findIndex((c) => c.seekerId === cv.seekerId);
  const newCv: CvProfile = {
    ...cv,
    id: existing >= 0 ? cvs[existing].id : `cv${Date.now()}`,
    uploadedAt: new Date().toISOString(),
  };
  if (existing >= 0) cvs[existing] = newCv;
  else cvs.push(newCv);
  write(CVS_KEY, cvs);
  return newCv;
}

export function getMyCv(seekerId: string): CvProfile | undefined {
  return getCvs().find((c) => c.seekerId === seekerId);
}

// ─── Status API ───────────────────────────────────────────────────────────────

export function getStatuses(): ApplicationStatus[] {
  return read<ApplicationStatus>(STATUSES_KEY, SEED_STATUSES);
}

export function updateEmployerStatus(statusId: string, message: string, stage: ApplicationStatus["stage"]): void {
  const statuses = getStatuses();
  const idx = statuses.findIndex((s) => s.id === statusId);
  if (idx < 0) return;
  statuses[idx] = { ...statuses[idx], employerUpdate: message, stage, updatedAt: new Date().toISOString() };
  write(STATUSES_KEY, statuses);
}

export function updateSeekerStatus(statusId: string, message: string): void {
  const statuses = getStatuses();
  const idx = statuses.findIndex((s) => s.id === statusId);
  if (idx < 0) return;
  statuses[idx] = { ...statuses[idx], seekerUpdate: message, updatedAt: new Date().toISOString() };
  write(STATUSES_KEY, statuses);
}

// ─── Reports API ──────────────────────────────────────────────────────────────

export function submitReport(report: Omit<Report, "id" | "submittedAt" | "resolved">): void {
  const reports = read<Report>(REPORTS_KEY, []);
  reports.push({ ...report, id: `rep${Date.now()}`, submittedAt: new Date().toISOString(), resolved: false });
  write(REPORTS_KEY, reports);
}

// ─── Verification API ─────────────────────────────────────────────────────────

export function getVerification(userId: string): VerificationRequest | undefined {
  return read<VerificationRequest>(VERIFY_KEY, []).find((v) => v.userId === userId);
}

export function submitVerification(req: Omit<VerificationRequest, "submittedAt" | "status">): void {
  const verifications = read<VerificationRequest>(VERIFY_KEY, []);
  const idx = verifications.findIndex((v) => v.userId === req.userId);
  const entry: VerificationRequest = { ...req, submittedAt: new Date().toISOString(), status: "pending" };
  if (idx >= 0) verifications[idx] = entry;
  else verifications.push(entry);
  write(VERIFY_KEY, verifications);
}
