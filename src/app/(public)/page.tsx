import { getAllCategories } from "@/lib/queries/categories";
import { getListings, getTopDeals } from "@/lib/queries/listings";
import Hero from "@/components/home/Hero";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import TopDeals from "@/components/home/TopDeals";
import FeaturedListings from "@/components/home/FeaturedListings";
import HowItWorks from "@/components/home/HowItWorks";
import CTASection from "@/components/home/CTASection";

export default async function HomePage() {
  const [categories, { listings }, topDeals] = await Promise.all([
    getAllCategories(),
    getListings({ limit: 8 }),
    getTopDeals(6),
  ]);

  return (
    <>
      <Hero />
      <FeaturedCategories categories={categories} />
      <TopDeals listings={topDeals} />
      <FeaturedListings listings={listings} />
      <HowItWorks />
      <CTASection />
    </>
  );
}
