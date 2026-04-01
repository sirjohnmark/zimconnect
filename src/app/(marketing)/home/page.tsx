import type { Metadata } from "next";
import { HeroSection }        from "@/components/marketing/HeroSection";
import { FeaturedCategories } from "@/components/marketing/FeaturedCategories";
import { FeaturedListings }   from "@/components/marketing/FeaturedListings";
import { HowItWorks }         from "@/components/marketing/HowItWorks";
import { TrustSection }       from "@/components/marketing/TrustSection";
import { CtaSection }         from "@/components/marketing/CtaSection";

export const metadata: Metadata = {
  title: "ZimConnect — Buy and Sell Anything in Zimbabwe",
  description: "Zimbabwe's #1 marketplace. Find electronics, vehicles, property, jobs and more.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCategories />
      <FeaturedListings />
      <HowItWorks />
      <TrustSection />
      <CtaSection />
    </>
  );
}
