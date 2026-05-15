/**
 * Single source of truth for the mock/API switch.
 *
 * Mock mode is ON when:
 *  - NEXT_PUBLIC_USE_MOCK is explicitly "true", OR
 *  - No real API URL is configured, OR
 *  - The configured URL still points at localhost
 *
 * Set NEXT_PUBLIC_USE_MOCK=false + NEXT_PUBLIC_API_URL=https://... to use the live API.
 */

const explicitlyEnabled = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const hasRealApi =
  !!process.env.NEXT_PUBLIC_API_URL &&
  !process.env.NEXT_PUBLIC_API_URL.includes("localhost");

export const USE_MOCK: boolean = explicitlyEnabled || !hasRealApi;
