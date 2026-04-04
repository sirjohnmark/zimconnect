// ─── Types ────────────────────────────────────────────────────────────────────

export type SchoolType = "day" | "boarding" | "both";
export type SchoolLevel = "primary" | "secondary" | "combined" | "tertiary";

export interface SchoolFees {
  termly?: number;
  annually?: number;
  currency: "USD" | "ZWL";
  notes?: string; // e.g. "Boarding surcharge: $200/term"
}

export interface SchoolProfile {
  id: string;
  ownerId: string;
  name: string;
  tagline?: string;
  description: string;
  level: SchoolLevel;
  type: SchoolType;
  location: string;
  city: string;
  fees?: SchoolFees;
  images: string[]; // min 2, max 5 — base64 or URLs
  contacts: {
    phone: string;
    email?: string;
    whatsapp?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
  verified: boolean;
}

// ─── Storage key ──────────────────────────────────────────────────────────────

const SCHOOLS_KEY = "zimconnect_schools";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_SCHOOLS: SchoolProfile[] = [
  {
    id: "sch1",
    ownerId: "sys",
    name: "St. John's College",
    tagline: "Excellence in Education Since 1953",
    description: "St. John's College is a leading Catholic boys' secondary school in Harare offering O-Level and A-Level programmes. We nurture academic excellence, character development, and sporting achievement in a disciplined and faith-filled environment.",
    level: "secondary",
    type: "boarding",
    location: "Borrowdale, Harare",
    city: "Harare",
    fees: { termly: 950, annually: 2850, currency: "USD", notes: "Boarding fees inclusive. Day scholar option available on request." },
    images: [
      "https://picsum.photos/seed/sch1a/800/500",
      "https://picsum.photos/seed/sch1b/800/500",
      "https://picsum.photos/seed/sch1c/800/500",
    ],
    contacts: { phone: "0242 883 456", email: "admissions@stjohns.ac.zw", whatsapp: "0771234567", website: "www.stjohns.ac.zw" },
    createdAt: "2026-03-01T08:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
    verified: true,
  },
  {
    id: "sch2",
    ownerId: "sys",
    name: "Chisipite Senior School",
    tagline: "Girls' School — Empowering Young Women",
    description: "Chisipite Senior School is a premier girls' secondary school providing quality education from Form 1 to Upper Sixth. Our holistic approach combines academic rigour with arts, sports, and leadership development.",
    level: "secondary",
    type: "both",
    location: "Chisipite, Harare",
    city: "Harare",
    fees: { termly: 880, annually: 2640, currency: "USD", notes: "Day: $880/term. Boarding: $1,150/term." },
    images: [
      "https://picsum.photos/seed/sch2a/800/500",
      "https://picsum.photos/seed/sch2b/800/500",
    ],
    contacts: { phone: "0242 497 123", email: "admin@chisipite.ac.zw", whatsapp: "0772345678" },
    createdAt: "2026-03-05T08:00:00Z",
    updatedAt: "2026-04-02T09:00:00Z",
    verified: true,
  },
  {
    id: "sch3",
    ownerId: "sys",
    name: "Mzilikazi Primary School",
    tagline: "Building Strong Foundations",
    description: "A well-established government primary school in Bulawayo offering Grade 1–7 education. Strong focus on literacy, numeracy, and Zimbabwean cultural values. ECD programmes available.",
    level: "primary",
    type: "day",
    location: "Mzilikazi, Bulawayo",
    city: "Bulawayo",
    fees: { termly: 45, annually: 135, currency: "USD" },
    images: [
      "https://picsum.photos/seed/sch3a/800/500",
      "https://picsum.photos/seed/sch3b/800/500",
    ],
    contacts: { phone: "0292 241 567", email: "mzilikazi.primary@gmail.com" },
    createdAt: "2026-03-10T08:00:00Z",
    updatedAt: "2026-04-01T08:00:00Z",
    verified: false,
  },
  {
    id: "sch4",
    ownerId: "sys",
    name: "Mutare Boys High School",
    tagline: "Tradition · Discipline · Excellence",
    description: "One of Zimbabwe's oldest secondary schools with a proud tradition of academic and sporting excellence. Fully equipped boarding facilities, science labs, and a dedicated library.",
    level: "secondary",
    type: "both",
    location: "Mutare CBD",
    city: "Mutare",
    fees: { termly: 720, annually: 2160, currency: "USD", notes: "Boarding surcharge: $180/term. ZWL payment accepted at official rate." },
    images: [
      "https://picsum.photos/seed/sch4a/800/500",
      "https://picsum.photos/seed/sch4b/800/500",
      "https://picsum.photos/seed/sch4c/800/500",
    ],
    contacts: { phone: "0202 64321", whatsapp: "0783456789", email: "info@mutareboys.ac.zw" },
    createdAt: "2026-03-15T08:00:00Z",
    updatedAt: "2026-04-03T10:00:00Z",
    verified: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readSchools(): SchoolProfile[] {
  if (typeof window === "undefined") return SEED_SCHOOLS;
  try {
    const raw = localStorage.getItem(SCHOOLS_KEY);
    return raw ? (JSON.parse(raw) as SchoolProfile[]) : SEED_SCHOOLS;
  } catch { return SEED_SCHOOLS; }
}

function writeSchools(data: SchoolProfile[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(data));
}

// ─── API ──────────────────────────────────────────────────────────────────────

export function getSchools(): SchoolProfile[] {
  return readSchools();
}

export function getSchool(id: string): SchoolProfile | undefined {
  return readSchools().find((s) => s.id === id);
}

export function getMySchool(ownerId: string): SchoolProfile | undefined {
  return readSchools().find((s) => s.ownerId === ownerId);
}

export function saveSchool(profile: Omit<SchoolProfile, "id" | "createdAt" | "updatedAt" | "verified">): SchoolProfile {
  const schools = readSchools();
  const existing = schools.findIndex((s) => s.ownerId === profile.ownerId);
  const now = new Date().toISOString();

  if (existing >= 0) {
    const updated: SchoolProfile = { ...schools[existing], ...profile, updatedAt: now };
    schools[existing] = updated;
    writeSchools(schools);
    return updated;
  }

  const newSchool: SchoolProfile = {
    ...profile,
    id: `sch${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    verified: false,
  };
  schools.push(newSchool);
  writeSchools(schools);
  return newSchool;
}
