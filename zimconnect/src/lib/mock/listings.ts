import type { Listing, ListingCondition } from "@/types/listing";

const NOW = new Date().toISOString();

const OWNER = { id: 1, username: "demo_seller", profile_picture: null };

function img(seed: string) {
  return { id: Number(seed), image: `https://picsum.photos/seed/${seed}/600/400`, caption: "", display_order: 0, is_primary: true };
}

function listing(
  id: number,
  title: string,
  price: number,
  location: string,
  condition: ListingCondition,
  categoryName: string,
  categorySlug: string,
  imgSeed: string,
  description = "",
): Listing {
  return {
    id,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${id}`,
    title,
    description,
    price: String(price),
    currency: "USD",
    condition,
    status: "ACTIVE",
    location,
    category: { name: categoryName, slug: categorySlug },
    owner: OWNER,
    images: [img(imgSeed)],
    primary_image: `https://picsum.photos/seed/${imgSeed}/600/400`,
    is_featured: false,
    views_count: 0,
    rejection_reason: null,
    created_at: NOW,
    updated_at: NOW,
    published_at: NOW,
  };
}

export const MOCK_LISTINGS: Listing[] = [
  // ── Electronics ──────────────────────────────────────────────────────────────
  listing(1,  "Samsung Galaxy S24 Ultra — 256GB, Phantom Black",   650,   "HARARE",   "LIKE_NEW", "Electronics",  "electronics",        "zc-1",  "Pristine condition, used 3 months. Original box and all accessories included."),
  listing(4,  'MacBook Pro M3 14" — 16GB RAM, 512GB SSD',          1800,  "HARARE",   "NEW",      "Electronics",  "electronics",        "zc-4",  "Sealed in box, space grey. Receipt and 1-year Apple warranty included."),
  listing(7,  "iPhone 15 Pro — 128GB, Natural Titanium",           950,   "HARARE",   "LIKE_NEW", "Electronics",  "electronics",        "zc-7"),
  listing(12, "PlayStation 5 — Disc Edition + 2 controllers",      480,   "BULAWAYO", "LIKE_NEW", "Electronics",  "electronics",        "zc-12", "Barely used, perfect working order. Comes with FIFA 24."),
  listing(13, "HP Laptop 15 — Intel i5, 8GB RAM, 256GB SSD",       420,   "GWERU",    "GOOD",     "Electronics",  "electronics",        "zc-13", "Works perfectly. Windows 11 activated. Charger included."),
  listing(14, "DJI Mini 3 Drone — Fly More Combo",                 890,   "HARARE",   "LIKE_NEW", "Electronics",  "electronics",        "zc-14", "Under 50 hours flight time. Extra batteries and ND filter kit included."),

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  listing(2,  "Toyota Corolla 2019 — 45,000km, Full Service History", 12500, "BULAWAYO", "GOOD",  "Vehicles",     "vehicles",           "zc-2",  "One owner, accident-free. New tyres fitted March 2024."),
  listing(5,  "Honda Fit 2017 — 62,000km, Manual",                 8500,  "MUTARE",   "GOOD",     "Vehicles",     "vehicles",           "zc-5"),
  listing(9,  "Mazda CX-5 2021 — AWD, Sunroof",                    22000, "HARARE",   "GOOD",     "Vehicles",     "vehicles",           "zc-9",  "Single owner. Full service history. Original paint. Sunroof, leather seats."),
  listing(15, "Isuzu D-Max 2020 — Double Cab, 4WD",                28000, "HARARE",   "GOOD",     "Vehicles",     "vehicles",           "zc-15", "Bull bar, canopy, low mileage. Ideal for farms or construction."),
  listing(16, "Yamaha YBR 125 Motorcycle — 2022",                  1800,  "MASVINGO", "LIKE_NEW", "Vehicles",     "vehicles",           "zc-16", "Low mileage (8,000 km), never repainted, logbook available."),

  // ── Property ─────────────────────────────────────────────────────────────────
  listing(3,  "2-Bedroom Apartment — Avondale, all-inclusive",     450,   "HARARE",   "NEW",      "Property",     "property",           "zc-3",  "Modern finishing, 24-hour security, water and electricity included."),
  listing(6,  "Office Space — Samora Machel CBD, 120m²",           900,   "HARARE",   "GOOD",     "Property",     "property",           "zc-6",  "Open plan, fibre-ready, parking included. Available immediately."),
  listing(11, "Studio Apartment — Borrowdale, furnished",          380,   "HARARE",   "GOOD",     "Property",     "property",           "zc-11", "Fully furnished with DSTV and Wi-Fi. Short or long term lease."),
  listing(17, "3-Bedroom House for Sale — Mutare CBD",             48000, "MUTARE",   "GOOD",     "Property",     "property",           "zc-17", "Fully walled, borehole, carport. Move-in ready. Negotiable."),
  listing(18, "Plot for Sale — 2000m², Ruwa",                      15000, "RUWA",     "NEW",      "Property",     "property",           "zc-18", "Fully surveyed, title deeds available. Municipal water connected."),

  // ── Services ─────────────────────────────────────────────────────────────────
  listing(10, "Plumbing Services — Emergency & Routine",           30,    "HARARE",   "NEW",      "Services",     "services",           "zc-10", "Licensed plumber, 10 years experience. Available 7 days."),
  listing(19, "Solar Installation — Residential & Commercial",     350,   "HARARE",   "NEW",      "Services",     "services",           "zc-19", "Full off-grid and hybrid systems. ZERA certified. Free site assessment."),
  listing(20, "Graphic Design & Printing Services",                15,    "BULAWAYO", "NEW",      "Services",     "services",           "zc-20", "Logo design, banners, T-shirts, business cards. Fast turnaround."),

  // ── Agriculture ───────────────────────────────────────────────────────────────
  listing(21, "Boerboel Puppies — Pure Breed",                     280,   "RUWA",     "NEW",      "Agriculture",  "agriculture",        "zc-21", "8 weeks old, vaccinated and dewormed. Parents on site."),
  listing(22, "Layer Chickens — Point of Lay, 50 Birds",           6,     "MARONDERA","NEW",      "Agriculture",  "agriculture",        "zc-22", "Vaccinated Lohmann Brown layers, point of lay (18 weeks). Healthy flock."),
  listing(23, "John Deere Tractor — 75HP, 2018",                   32000, "CHEGUTU",  "GOOD",     "Agriculture",  "agriculture",        "zc-23", "Low hours, full service history. Comes with disc harrow and plough."),

  // ── Fashion ───────────────────────────────────────────────────────────────────
  listing(24, "Men's Nike Air Force 1 — Size 10, White",           55,    "HARARE",   "NEW",      "Fashion",      "fashion",            "zc-24", "Brand new in box, authentic. US size 10."),
  listing(25, "African Print Dress — Ankara Fabric",               18,    "HARARE",   "NEW",      "Fashion",      "fashion",            "zc-25", "Handmade, fully lined. Available in sizes S–XL. Custom sizing on request."),

  // ── Home & Garden ─────────────────────────────────────────────────────────────
  listing(26, "L-Shape Lounge Suite — 7-Seater",                   480,   "HARARE",   "GOOD",     "Home & Garden","home",               "zc-26", "Clean, no tears. Moving sale — must go this weekend."),
  listing(27, "Inverter Fridge — 250L, Samsung",                   320,   "BULAWAYO", "GOOD",     "Home & Garden","home",               "zc-27", "Energy efficient, works perfectly. No scratches. Selling due to upgrade."),

  // ── Hardware ─────────────────────────────────────────────────────────────────
  listing(28, "Angle Grinder — Bosch 125mm, 1100W",                45,    "HARARE",   "GOOD",     "Hardware",     "hardware",           "zc-28", "Lightly used, all discs included. Selling as switching to battery tools."),
  listing(29, "Building Bricks — 2,000 Units, Fired Clay",         0.18,  "HARARE",   "NEW",      "Hardware",     "hardware",           "zc-29", "High-quality fired clay bricks. Can supply more on order."),

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  listing(8,  "Software Engineer — Remote, USD salary",            1200,  "HARARE",   "NEW",      "Jobs",         "jobs",               "zc-8",  "3+ years React/Node. Competitive salary. Full-time remote."),
  listing(30, "Accountant — CA(Z) or ACCA, Harare",               800,   "HARARE",   "NEW",      "Jobs",         "jobs",               "zc-30", "Minimum 3 years experience. Must be conversant with Pastel and ZIMRA e-filing."),

  // ── Other ────────────────────────────────────────────────────────────────────
  listing(31, "Event Catering — Buffet & Sit-Down, Up to 500 Pax", 12,   "HARARE",   "NEW",      "Catering",     "catering",           "zc-31", "Full service — food, crockery, décor, staff."),
  listing(32, "10-Tonne Haulage Truck — Available for Hire",       120,   "HARARE",   "GOOD",     "Transportation","transportation",     "zc-32", "Reliable Isuzu FTR 10-tonne. Driver included. Available for long-haul."),
  listing(33, "Epson A3 Photo Printer — L1800",                    380,   "HARARE",   "LIKE_NEW", "Printing & Machinery","printing-machinery","zc-33","Under 500 prints. Original Epson inks included. Receipt available."),
  listing(34, "Gold Sluice Box — 4m, Aluminium",                   220,   "KWEKWE",   "GOOD",     "Mining Equipment","mining-equipment",  "zc-34", "Used one season. Good recovery rate. Selling due to relocating."),
];
