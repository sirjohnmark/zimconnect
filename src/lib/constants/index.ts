// TODO: expand as needed
export const SITE_NAME = "ZimConnect";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_DESCRIPTION = "Zimbabwe's marketplace for buying and selling anything.";

export const LISTINGS_PER_PAGE = 24;
export const CATEGORY_LISTINGS_PER_PAGE = 12;
export const FEATURED_LISTINGS_COUNT = 8;

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGES_PER_LISTING = 6;

export const ZIMBABWE_CITIES = [
  "Harare",
  "Bulawayo",
  "Mutare",
  "Gweru",
  "Masvingo",
  "Kwekwe",
  "Kadoma",
  "Chinhoyi",
  "Victoria Falls",
  "Zvishavane",
] as const;
