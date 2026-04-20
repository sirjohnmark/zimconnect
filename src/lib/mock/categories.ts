import type { Category } from "@/types/category";

const NOW = new Date().toISOString();

function cat(id: number, name: string, slug: string, count?: number): Category {
  return {
    id,
    name,
    slug,
    description: "",
    parent: null,
    icon: "",
    image: null,
    is_active: true,
    display_order: id,
    created_at: NOW,
    updated_at: NOW,
    count,
  };
}

export const MOCK_CATEGORIES: Category[] = [
  cat(1,  "Electronics",          "electronics",         1240),
  cat(2,  "Vehicles",             "vehicles",            876),
  cat(3,  "Property",             "property",            532),
  cat(4,  "Jobs",                 "jobs",                318),
  cat(5,  "Services",             "services",            204),
  cat(6,  "Fashion",              "fashion",             950),
  cat(7,  "Agriculture",          "agriculture",         143),
  cat(8,  "Home & Garden",        "home",                421),
  cat(9,  "Hardware",             "hardware",            187),
  cat(10, "Mining Equipment",     "mining-equipment",    64),
  cat(11, "Printing & Machinery", "printing-machinery",  92),
  cat(12, "Transportation",       "transportation",      158),
  cat(13, "Catering",             "catering",            113),
  cat(14, "Schools",              "schools",             76),
];
