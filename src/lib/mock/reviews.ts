// ─── Types ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  listingId: string;
  sellerId: string;     // seller name used as key in mock
  buyerId: string;      // "me" for current user
  buyerName: string;
  buyerInitial: string;
  rating: number;       // 1–5
  comment: string;
  createdAt: string;
  helpful: number;      // upvote count
  helpfulVoters: string[]; // buyer IDs who clicked helpful
}

// ─── Storage key ──────────────────────────────────────────────────────────────

const REVIEWS_KEY = "sanganai_reviews";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_REVIEWS: Review[] = [
  {
    id: "rv1", listingId: "1", sellerId: "Tinashe Moyo",
    buyerId: "buyer1", buyerName: "Rutendo C.", buyerInitial: "R",
    rating: 5, comment: "Excellent seller! Phone was exactly as described — pristine condition. Fast to respond on WhatsApp and even helped arrange a safe meeting point. Highly recommend.",
    createdAt: "2026-03-20T10:30:00Z", helpful: 4, helpfulVoters: ["buyer2", "buyer3", "buyer4", "buyer5"],
  },
  {
    id: "rv2", listingId: "1", sellerId: "Tinashe Moyo",
    buyerId: "buyer2", buyerName: "Farai N.", buyerInitial: "F",
    rating: 4, comment: "Good deal. Phone works perfectly. Minor scuff I didn't notice in the photos, but seller was honest once I pointed it out and adjusted the price slightly. Would buy again.",
    createdAt: "2026-03-18T14:00:00Z", helpful: 2, helpfulVoters: ["buyer1", "buyer3"],
  },
  {
    id: "rv3", listingId: "2", sellerId: "Farai Ncube",
    buyerId: "buyer3", buyerName: "Blessing M.", buyerInitial: "B",
    rating: 5, comment: "Smooth transaction. Car was in even better condition than the photos. Seller was patient and answered all my questions. Test drive was arranged promptly.",
    createdAt: "2026-03-15T09:00:00Z", helpful: 6, helpfulVoters: ["buyer1", "buyer2", "buyer4", "buyer5", "buyer6", "buyer7"],
  },
  {
    id: "rv4", listingId: "3", sellerId: "Chiedza Estates",
    buyerId: "buyer4", buyerName: "Tatenda K.", buyerInitial: "T",
    rating: 3, comment: "Apartment is nice but the description said 24-hour water which wasn't always the case. Still, the location and price are fair. Agent was professional throughout.",
    createdAt: "2026-03-10T11:00:00Z", helpful: 3, helpfulVoters: ["buyer1", "buyer5", "buyer6"],
  },
  {
    id: "rv5", listingId: "8", sellerId: "TechZim Recruits",
    buyerId: "buyer5", buyerName: "Ian M.", buyerInitial: "I",
    rating: 5, comment: "Very professional recruiter. They kept me updated at every stage of the hiring process and were completely transparent about the role. Got the job! Great experience.",
    createdAt: "2026-04-01T16:00:00Z", helpful: 8, helpfulVoters: ["buyer1", "buyer2", "buyer3", "buyer4", "buyer6", "buyer7", "buyer8", "buyer9"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readReviews(): Review[] {
  if (typeof window === "undefined") return SEED_REVIEWS;
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? (JSON.parse(raw) as Review[]) : SEED_REVIEWS;
  } catch { return SEED_REVIEWS; }
}

function writeReviews(data: Review[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(data));
}

// ─── API ──────────────────────────────────────────────────────────────────────

export function getReviewsForListing(listingId: string): Review[] {
  return readReviews()
    .filter((r) => r.listingId === listingId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReviewsForSeller(sellerName: string): Review[] {
  return readReviews()
    .filter((r) => r.sellerId === sellerName)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSellerStats(sellerName: string): { average: number; total: number; breakdown: Record<number, number> } {
  const reviews = getReviewsForSeller(sellerName);
  if (reviews.length === 0) return { average: 0, total: 0, breakdown: {} };
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  reviews.forEach((r) => { sum += r.rating; breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1; });
  return { average: Math.round((sum / reviews.length) * 10) / 10, total: reviews.length, breakdown };
}

export function hasReviewed(listingId: string, buyerId: string): boolean {
  return readReviews().some((r) => r.listingId === listingId && r.buyerId === buyerId);
}

export function submitReview(review: Omit<Review, "id" | "createdAt" | "helpful" | "helpfulVoters">): Review {
  const reviews = readReviews();
  const newReview: Review = {
    ...review,
    id: `rv${Date.now()}`,
    createdAt: new Date().toISOString(),
    helpful: 0,
    helpfulVoters: [],
  };
  reviews.push(newReview);
  writeReviews(reviews);
  return newReview;
}

export function toggleHelpful(reviewId: string, voterId: string): void {
  const reviews = readReviews();
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx < 0) return;
  const r = reviews[idx];
  if (r.helpfulVoters.includes(voterId)) {
    reviews[idx] = { ...r, helpful: r.helpful - 1, helpfulVoters: r.helpfulVoters.filter((v) => v !== voterId) };
  } else {
    reviews[idx] = { ...r, helpful: r.helpful + 1, helpfulVoters: [...r.helpfulVoters, voterId] };
  }
  writeReviews(reviews);
}
