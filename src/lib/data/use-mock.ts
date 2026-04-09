/**
 * Single source of truth for the mock/API switch.
 *
 * Mock mode is ON unless all three conditions are met:
 *  1. NEXT_PUBLIC_USE_MOCK is explicitly "false"
 *  2. We are NOT in a production build
 *  3. A real API URL has been configured (not the default localhost)
 *
 * This means Vercel deployments are always safe — they never try to
 * reach localhost during prerender even if env vars are missing.
 */

const explicitlyDisabled = process.env.NEXT_PUBLIC_USE_MOCK === "false";
const hasRealApi =
  !!process.env.NEXT_PUBLIC_API_URL &&
  !process.env.NEXT_PUBLIC_API_URL.includes("localhost");
const isProduction = process.env.NODE_ENV === "production";

export const USE_MOCK: boolean =
  !explicitlyDisabled || !hasRealApi || isProduction;
