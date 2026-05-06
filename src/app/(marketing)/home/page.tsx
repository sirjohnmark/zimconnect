import type { Metadata } from "next";
import { HomeAuthGuard }    from "@/components/auth/HomeAuthGuard";
import { HeroSection }      from "@/components/marketing/HeroSection";
import { FeaturedListings } from "@/components/marketing/FeaturedListings";
import { HowItWorks }       from "@/components/marketing/HowItWorks";
import { TrustSection }     from "@/components/marketing/TrustSection";
import { CtaSection }       from "@/components/marketing/CtaSection";

export const metadata: Metadata = {
  title: "Sanganai — Buy and Sell Anything in Zimbabwe",
  description: "Zimbabwe's #1 marketplace. Find electronics, vehicles, property, jobs and more.",
};

export default function HomePage() {
  return (
    <>
      <HomeAuthGuard />
      <HeroSection />
      <FeaturedListings />
      <HowItWorks />
      <TrustSection />
      <CtaSection />
    </>
  );
}
