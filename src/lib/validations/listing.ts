import { z } from "zod";

export const LISTING_CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"] as const;

export const ZIMBABWE_CITIES = [
  "HARARE", "BULAWAYO", "MUTARE", "GWERU", "KWEKWE", "KADOMA",
  "MASVINGO", "CHINHOYI", "BINDURA", "CHEGUTU", "MARONDERA",
  "KAROI", "VICTORIA_FALLS", "HWANGE", "BEITBRIDGE", "CHITUNGWIZA",
  "EPWORTH", "NORTON", "RUWA", "ZVISHAVANE", "CHIREDZI", "CHIPINGE",
  "RUSAPE", "PLUMTREE", "GWANDA", "SHURUGWI", "REDCLIFF", "KARIBA",
  "NYANGA", "MVURWI", "GOKWE", "LUPANE", "TRIANGLE", "OTHER",
] as const;

export const CITY_LABELS: Record<string, string> = {
  HARARE: "Harare", BULAWAYO: "Bulawayo", MUTARE: "Mutare", GWERU: "Gweru",
  KWEKWE: "Kwekwe", KADOMA: "Kadoma", MASVINGO: "Masvingo", CHINHOYI: "Chinhoyi",
  BINDURA: "Bindura", CHEGUTU: "Chegutu", MARONDERA: "Marondera", KAROI: "Karoi",
  VICTORIA_FALLS: "Victoria Falls", HWANGE: "Hwange", BEITBRIDGE: "Beitbridge",
  CHITUNGWIZA: "Chitungwiza", EPWORTH: "Epworth", NORTON: "Norton", RUWA: "Ruwa",
  ZVISHAVANE: "Zvishavane", CHIREDZI: "Chiredzi", CHIPINGE: "Chipinge",
  RUSAPE: "Rusape", PLUMTREE: "Plumtree", GWANDA: "Gwanda", SHURUGWI: "Shurugwi",
  REDCLIFF: "Redcliff", KARIBA: "Kariba", NYANGA: "Nyanga", MVURWI: "Mvurwi",
  GOKWE: "Gokwe", LUPANE: "Lupane", TRIANGLE: "Triangle", OTHER: "Other",
};

export const CONDITION_LABELS: Record<string, string> = {
  NEW: "New", LIKE_NEW: "Like New", GOOD: "Good", FAIR: "Fair", POOR: "Poor",
};

export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be under 100 characters"),

  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be under 2000 characters"),

  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid price greater than 0"),

  currency: z.enum(["USD", "ZWL"]).default("USD"),

  condition: z.enum(LISTING_CONDITIONS, { error: "Select a condition" }),

  category_id: z
    .number({ error: "Select a category" })
    .int()
    .positive("Select a category"),

  location: z.enum(ZIMBABWE_CITIES, { error: "Select a city" }),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
