import Hero from "../components/Hero";
import Features from "../components/Features";
import Categories from "../components/Categories";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";

export default function Home() {
    return (
        <div className="flex flex-col">
            <Hero />
            <Features />
            <Categories />
            <HowItWorks />
            <CTA />
        </div>
    );
}
