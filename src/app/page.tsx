import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { BrandStorySection } from "@/components/sections/BrandStorySection";
import { ContactCTASection } from "@/components/sections/ContactCTASection";
import { ExperienceCTASection } from "@/components/sections/ExperienceCTASection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ServicesPreviewSection } from "@/components/sections/ServicesPreviewSection";
import { siteConfig } from "@/config/site";

const title = `${siteConfig.name} — Care that goes beyond clean`;
const description =
  "More than laundry. Shots Laundry is a thoughtful approach to garment care, precision and freshness — washing, ironing and delivery.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/" },
  twitter: { title, description },
};

export default function HomePage() {
  return (
    <>
      <main className="flex-1">
        <HeroSection />
        <BrandStorySection />
        <ServicesPreviewSection />
        <ExperienceCTASection />
        <ContactCTASection />
      </main>
      <Footer />
    </>
  );
}
