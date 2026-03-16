import { getAllCategories } from "@/lib/queries/categories";
import { getListings } from "@/lib/queries/listings";
import Hero from "@/components/home/Hero";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import FeaturedListings from "@/components/home/FeaturedListings";
import HowItWorks from "@/components/home/HowItWorks";
import CTASection from "@/components/home/CTASection";

export default async function HomePage() {
  // Parallelise both DB calls — neither depends on the other.
  const [categories, { listings }] = await Promise.all([
    getAllCategories(),
    getListings({ limit: 8 }),
  ]);

  return (
    <>
      <Hero />
      <FeaturedCategories categories={categories} />
      <FeaturedListings listings={listings} />
      <HowItWorks />
      <CTASection />
    </>
  );
}
