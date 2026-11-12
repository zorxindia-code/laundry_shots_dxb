import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Sparkle } from "@/components/ui/Sparkle";
import { SplitHeading } from "@/components/ui/SplitHeading";

/**
 * Closing scene of /experience, directly after the laundry journey. Navy like
 * scene 05, so the journey's last panel flows straight into it, then hands
 * over to /contact.
 */
export function ExperienceOutro({ backgroundColor }: { backgroundColor?: string }) {
  return (
    <section
      data-nav-tone="navy"
      aria-labelledby="experience-outro-heading"
      className="relative isolate overflow-hidden bg-brand-navy text-brand-white"
      // Matches the journey's final frame so the hand-over is seamless.
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute bottom-[-30%] left-1/2 aspect-square w-[min(150vw,80rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_closest-side,rgb(168_184_224/0.18),transparent)]" />
      </div>

      <ScrollReveal className="flex min-h-[90svh] flex-col items-center justify-center px-5 py-28 text-center sm:px-8 lg:px-12">
        <div data-reveal className="flex items-center gap-3">
          <Sparkle className="size-3" />
          <Eyebrow className="text-brand-soft-blue">The journey is complete</Eyebrow>
        </div>
        <SplitHeading
          id="experience-outro-heading"
          motion="reveal"
          lines={["Your clothes.", "Ready for what's next."]}
          lineClassNames={[undefined, "text-brand-yellow"]}
          className="mt-10 text-[clamp(2.6rem,9.5vw,8.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.05em]"
        />
        <p data-reveal className="mt-8 max-w-[42ch] text-base leading-relaxed text-brand-white/75 lg:text-lg">
          From the first stain to the final fold — let&apos;s talk about what your wardrobe needs.
        </p>
        <div data-reveal data-reveal-delay="0.1" className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <ButtonLink href="/contact" arrow>
            Let&apos;s connect
          </ButtonLink>
          <a
            href="#journey"
            className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-brand-white/70 underline-offset-8 transition-colors hover:text-brand-yellow hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow"
          >
            Replay the journey
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}
