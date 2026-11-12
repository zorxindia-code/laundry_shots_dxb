import type { Metadata } from "next";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Footer } from "@/components/layout/Footer";
import { ContactClosing } from "@/components/sections/ContactClosing";
import { ContactDetails } from "@/components/sections/ContactDetails";
import { ContactForm } from "@/components/sections/ContactForm";
import { ContactHero } from "@/components/sections/ContactHero";

const title = "Contact";
const description =
  "Have a garment-care enquiry or need help with your laundry? Get in touch with Shots Laundry — we'd love to hear from you.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: { title: `${title} | Shots Laundry`, description, url: "/contact" },
  twitter: { title: `${title} | Shots Laundry`, description },
};

export default function ContactPage() {
  return (
    <>
      <main id="main-content" className="flex-1">
        <ContactHero />

        {/* Asymmetric split: details on navy, enquiry form on a white panel. */}
        <section data-nav-tone="navy" aria-label="Contact details and enquiry form" className="bg-brand-navy text-brand-white">
          <ScrollReveal className="relative grid gap-16 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pb-36">
            <div className="lg:col-span-5 lg:pt-16">
              <ContactDetails />
            </div>

            {/* Animated yellow accent line between the columns */}
            <div aria-hidden className="absolute bottom-36 left-[calc(5/12*100%+1rem)] top-10 hidden w-px bg-brand-white/10 lg:block">
              <span data-draw="y" className="block h-full w-px origin-top bg-brand-yellow" />
            </div>

            <div id="enquiry" data-nav-tone="light" className="relative lg:col-span-6 lg:col-start-7">
              <div data-reveal className="bg-brand-white px-6 py-10 text-brand-navy sm:px-10 sm:py-12 lg:px-14 lg:py-16">
                <p className="flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-brand-navy/60">
                  <span className="font-mono tabular-nums">02</span>
                  <span aria-hidden className="h-px w-8 bg-brand-navy" />
                  Enquiry
                </p>
                <h2 className="mt-6 text-[clamp(2rem,4vw,3.25rem)] font-bold uppercase leading-[0.95] tracking-[-0.04em]">
                  Tell us what
                  <br />
                  you need.
                </h2>
                <p className="mb-10 mt-4 max-w-[44ch] text-base leading-relaxed text-brand-navy/65">
                  Share a few details and we&apos;ll get back to you.
                </p>
                <ContactForm />
              </div>
              <span aria-hidden className="absolute -right-2 -top-2 hidden h-20 w-20 border-r-2 border-t-2 border-brand-yellow sm:block" />
            </div>
          </ScrollReveal>
        </section>

        <ContactClosing />
      </main>
      <Footer />
    </>
  );
}
