import { z } from "zod";

export const LISTING_CONDITIONS = [
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
  "POOR",
] as const;

export const ZIMBABWE_CITIES = [
  "HARARE",
  "BULAWAYO",
  "MUTARE",
  "GWERU",
  "KWEKWE",
  "KADOMA",
  "MASVINGO",
  "CHINHOYI",
  "BINDURA",
  "CHEGUTU",
  "MARONDERA",
  "KAROI",
  "VICTORIA_FALLS",
  "HWANGE",
  "BEITBRIDGE",
  "CHITUNGWIZA",
  "EPWORTH",
  "NORTON",
  "RUWA",
  "ZVISHAVANE",
  "CHIREDZI",
  "CHIPINGE",
  "RUSAPE",
  "PLUMTREE",
  "GWANDA",
  "SHURUGWI",
  "REDCLIFF",
  "KARIBA",
  "NYANGA",
  "MVURWI",
  "GOKWE",
  "LUPANE",
  "TRIANGLE",
  "OTHER",
] as const;

export const CITY_LABELS: Record<(typeof ZIMBABWE_CITIES)[number], string> = {
  HARARE: "Harare",
  BULAWAYO: "Bulawayo",
  MUTARE: "Mutare",
  GWERU: "Gweru",
  KWEKWE: "Kwekwe",
  KADOMA: "Kadoma",
  MASVINGO: "Masvingo",
  CHINHOYI: "Chinhoyi",
  BINDURA: "Bindura",
  CHEGUTU: "Chegutu",
  MARONDERA: "Marondera",
  KAROI: "Karoi",
  VICTORIA_FALLS: "Victoria Falls",
  HWANGE: "Hwange",
  BEITBRIDGE: "Beitbridge",
  CHITUNGWIZA: "Chitungwiza",
  EPWORTH: "Epworth",
  NORTON: "Norton",
  RUWA: "Ruwa",
  ZVISHAVANE: "Zvishavane",
  CHIREDZI: "Chiredzi",
  CHIPINGE: "Chipinge",
  RUSAPE: "Rusape",
  PLUMTREE: "Plumtree",
  GWANDA: "Gwanda",
  SHURUGWI: "Shurugwi",
  REDCLIFF: "Redcliff",
  KARIBA: "Kariba",
  NYANGA: "Nyanga",
  MVURWI: "Mvurwi",
  GOKWE: "Gokwe",
  LUPANE: "Lupane",
  TRIANGLE: "Triangle",
  OTHER: "Other",
};

export const CONDITION_LABELS: Record<(typeof LISTING_CONDITIONS)[number], string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

export const createListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Add a clearer title")
    .max(100, "Keep the title under 100 characters"),

  description: z
    .string()
    .trim()
    .min(20, "Add more detail about the item")
    .max(2000, "Keep the description under 2000 characters"),

  price: z
    .string()
    .trim()
    .min(1, "Enter a price")
    .refine(
      (value) => {
        const price = Number(value);
        return Number.isFinite(price) && price > 0;
      },
      "Enter a valid price",
    ),

  currency: z.enum(["USD", "ZWL"], {
    error: "Choose a currency",
  }),

  condition: z.enum(LISTING_CONDITIONS, {
    error: "Choose the item condition",
  }),

  category_id: z
    .number({
      error: "Choose a category",
    })
    .int("Choose a category")
    .positive("Choose a category"),

  location: z.enum(ZIMBABWE_CITIES, {
    error: "Choose a location",
  }),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;