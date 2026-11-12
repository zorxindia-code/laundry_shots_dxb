import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Sparkle } from "@/components/ui/Sparkle";
import { SplitHeading } from "@/components/ui/SplitHeading";

/** "Ready for a fresh start?" — the homepage's yellow accent block, leading to /contact. */
export function ContactCTASection() {
  return (
    <section
      data-nav-tone="yellow"
      aria-labelledby="contact-cta-heading"
      className="relative overflow-hidden bg-brand-yellow text-brand-navy"
    >
      <ScrollReveal className="grid gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:items-end lg:px-12 lg:py-32">
        <div className="relative lg:col-span-8">
          <Sparkle className="absolute -top-8 left-0 size-6 text-brand-navy lg:-top-10 lg:size-8" />
          <SplitHeading
            id="contact-cta-heading"
            motion="reveal"
            lines={["Ready for a", "fresh start?"]}
            className="text-[clamp(2.6rem,9vw,7.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.05em]"
          />
        </div>
        <div className="lg:col-span-4">
          <p data-reveal className="max-w-[36ch] text-base leading-relaxed text-brand-navy/75 lg:text-lg">
            Tell us what your wardrobe needs — we&apos;ll take it from there.
          </p>
          <div data-reveal data-reveal-delay="0.1" className="mt-8">
            <ButtonLink href="/contact" variant="navy" arrow>
              Contact us
            </ButtonLink>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
