import type { WholesaleListing } from "@/types/wholesale";

const STORAGE_KEY = "sanganai_wholesale";

export const MOCK_WHOLESALE: WholesaleListing[] = [
  {
    id: "w1",
    title: "Fresh Tomatoes — Grade A",
    description: "Farm-fresh tomatoes sourced from Marondera. Packed in 10 kg crates. Available weekly. Ideal for supermarkets, restaurants, and vendors.",
    price: 6,
    priceUnit: "per kg",
    moq: 50,
    moqUnit: "kg",
    location: "Harare",
    sublocation: "Mbare Musika",
    category: "agriculture",
    images: [{ url: "https://picsum.photos/seed/ws-1/600/400" }],
    seller: { name: "Marondera Fresh Farms", phone: "0771234567" },
    delivery: { available: true, note: "Free delivery to Harare CBD for orders over 100 kg." },
    createdAt: "2026-03-10",
  },
  {
    id: "w2",
    title: "Samsung LED TVs — 43 inch",
    description: "Brand new Samsung 43-inch smart TVs. Original sealed boxes with full manufacturer warranty. Minimum 10 units per order.",
    price: 180,
    priceUnit: "per unit",
    moq: 10,
    moqUnit: "units",
    location: "Harare",
    sublocation: "CBD",
    category: "electronics",
    images: [{ url: "https://picsum.photos/seed/ws-2/600/400" }],
    seller: { name: "Kudzi Electronics Wholesale", phone: "0714567890" },
    delivery: { available: true, note: "Nationwide delivery — $15 per TV outside Harare." },
    createdAt: "2026-03-12",
  },
  {
    id: "w3",
    title: "Portland Cement — 50 kg Bags",
    description: "PPC Portland cement, 50 kg bags. Consistent quality, great for construction projects. Bulk pricing available from 100 bags.",
    price: 9,
    priceUnit: "per bag",
    moq: 50,
    moqUnit: "bags",
    location: "Bulawayo",
    sublocation: "Belmont",
    category: "hardware",
    images: [{ url: "https://picsum.photos/seed/ws-3/600/400" }],
    seller: { name: "Ncube Building Supplies", phone: "0782345678" },
    delivery: { available: true, note: "Delivery within Bulawayo — $20 per load." },
    createdAt: "2026-03-14",
  },
  {
    id: "w4",
    title: "White T-Shirts — Unbranded for Printing",
    description: "Plain white cotton T-shirts, ideal for screen printing, embroidery and uniform use. Available in S/M/L/XL. 100% cotton 180gsm.",
    price: 2.5,
    priceUnit: "per shirt",
    moq: 100,
    moqUnit: "shirts",
    location: "Harare",
    sublocation: "Graniteside",
    category: "fashion",
    images: [{ url: "https://picsum.photos/seed/ws-4/600/400" }],
    seller: { name: "Zim Garment Traders", phone: "0773456789" },
    delivery: { available: false },
    createdAt: "2026-03-15",
  },
  {
    id: "w5",
    title: "Cooking Oil — 2 Litre Bottles",
    description: "Olivine cooking oil, 2-litre bottles. Full cartons of 12 bottles. Steady supply, suitable for supermarkets and wholesalers.",
    price: 22,
    priceUnit: "per carton",
    moq: 20,
    moqUnit: "cartons",
    location: "Harare",
    sublocation: "Workington",
    category: "catering",
    images: [{ url: "https://picsum.photos/seed/ws-5/600/400" }],
    seller: { name: "Harare Food Distributors", phone: "0776789012" },
    delivery: { available: true, note: "Free delivery within Harare for 50+ cartons." },
    createdAt: "2026-03-18",
  },
  {
    id: "w6",
    title: "Maize — White & Yellow",
    description: "Dried maize (white and yellow), clean and sorted. Sourced from Chegutu and Kadoma farmers. Suitable for millers and feed manufacturers.",
    price: 280,
    priceUnit: "per tonne",
    moq: 5,
    moqUnit: "tonnes",
    location: "Chegutu",
    sublocation: "Hintonville",
    category: "agriculture",
    images: [{ url: "https://picsum.photos/seed/ws-6/600/400" }],
    seller: { name: "Chegutu Grain Merchants", phone: "0785678901" },
    delivery: { available: true, note: "Delivery via own fleet — quote provided on request." },
    createdAt: "2026-03-20",
  },
  {
    id: "w7",
    title: "A4 Copy Paper — 80gsm Reams",
    description: "High-brightness 80gsm A4 copy paper. Box of 5 reams. Suitable for offices, print shops, and schools. Consistent quality.",
    price: 14,
    priceUnit: "per box",
    moq: 20,
    moqUnit: "boxes",
    location: "Harare",
    sublocation: "Msasa",
    category: "printing-machinery",
    images: [{ url: "https://picsum.photos/seed/ws-7/600/400" }],
    seller: { name: "Office Paper Distributors", phone: "0717890123" },
    delivery: { available: true, note: "Free delivery to Harare & surrounds for 50+ boxes." },
    createdAt: "2026-03-22",
  },
  {
    id: "w8",
    title: "Diesel — Bulk Supply",
    description: "EN590 diesel fuel for commercial and mining operations. Available in 5,000 litre minimum loads. ZERA-registered supplier.",
    price: 1.42,
    priceUnit: "per litre",
    moq: 5000,
    moqUnit: "litres",
    location: "Mutare",
    sublocation: "CBD",
    category: "mining-equipment",
    images: [{ url: "https://picsum.photos/seed/ws-8/600/400" }],
    seller: { name: "Eastern Fuel Traders", phone: "0778901234" },
    delivery: { available: true, note: "Tanker delivery nationwide — contact for pricing." },
    createdAt: "2026-03-24",
  },
];

// ── Storage helpers ────────────────────────────────────────────────────────────

function getStoredListings(): WholesaleListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WholesaleListing[]) : [];
  } catch {
    return [];
  }
}

function saveToStore(listing: WholesaleListing): void {
  if (typeof window === "undefined") return;
  const existing = getStoredListings();
  existing.unshift(listing);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

// ── Public functions ───────────────────────────────────────────────────────────

export interface GetWholesaleParams {
  q?: string;
  loc?: string;
  category?: string;
}

export interface WholesaleResult {
  listings: WholesaleListing[];
  isFallback: boolean;
}

export function getWholesaleListings(params: GetWholesaleParams = {}): WholesaleResult {
  const { q = "", loc = "", category = "" } = params;

  const stored = getStoredListings();
  const seedIds = new Set(MOCK_WHOLESALE.map((l) => l.id));
  const userListings = stored.filter((l) => !seedIds.has(l.id));
  let pool = [...userListings, ...MOCK_WHOLESALE];

  // Hard filters
  if (category) pool = pool.filter((l) => l.category === category);
  if (loc.trim()) {
    const locTerm = loc.trim().toLowerCase();
    pool = pool.filter(
      (l) =>
        l.location.toLowerCase().includes(locTerm) ||
        l.sublocation?.toLowerCase().includes(locTerm),
    );
  }

  const qWords = q.trim().toLowerCase().split(/\s+/).filter(Boolean);

  function score(l: WholesaleListing): number {
    if (qWords.length === 0) return 1;
    const hay = [l.title, l.description ?? "", l.location, l.sublocation ?? "", l.category ?? ""]
      .join(" ").toLowerCase();
    return qWords.filter((w) => hay.includes(w)).length;
  }

  const scored = pool.map((l) => ({ l, s: score(l) }));
  const exact = scored.filter(({ s }) => qWords.length === 0 || s === qWords.length);
  const isFallback = exact.length === 0 && qWords.length > 0;
  const results = (isFallback ? scored.filter(({ s }) => s > 0) : exact)
    .sort((a, b) => b.s - a.s)
    .map(({ l }) => l);

  return { listings: results, isFallback };
}

export function getWholesaleListing(id: string): WholesaleListing | undefined {
  const all = [...getStoredListings(), ...MOCK_WHOLESALE];
  return all.find((l) => l.id === id);
}

export function getMyWholesaleListings(sellerId: string): WholesaleListing[] {
  return getStoredListings().filter((l) => l.seller.id === sellerId);
}

export function createWholesaleListing(listing: Omit<WholesaleListing, "id" | "createdAt">): WholesaleListing {
  const newListing: WholesaleListing = {
    ...listing,
    id: `w-local-${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  saveToStore(newListing);
  return newListing;
}
