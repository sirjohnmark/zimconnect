/**
 * Saved (bookmarked) listings — localStorage backed.
 * Key: "sanganai_saved"  →  string[]  (listing IDs)
 */

const STORAGE_KEY = "sanganai_saved";

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getSavedIds(): string[] {
  return load();
}

export function isSaved(listingId: string): boolean {
  return load().includes(listingId);
}

export function toggleSaved(listingId: string): boolean {
  const ids = load();
  const exists = ids.includes(listingId);
  const next = exists ? ids.filter((id) => id !== listingId) : [...ids, listingId];
  persist(next);
  return !exists; // returns new saved state
}

export function removeSaved(listingId: string): void {
  persist(load().filter((id) => id !== listingId));
}
