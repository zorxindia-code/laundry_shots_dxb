import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ElementImage } from "@/components/ui/ProductImage";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { journeyStages } from "@/config/journey";
import { formatStep } from "@/lib/utils";

/**
 * Transition into the experience: a dramatic navy band with the headline,
 * a yellow CTA to /experience and a quiet index of the five journey scenes
 * (their products in miniature) — a teaser, not a copy of the animation.
 */
export function ExperienceCTASection() {
  return (
    <section
      data-nav-tone="navy"
      aria-labelledby="experience-cta-heading"
      className="relative isolate overflow-hidden bg-brand-navy text-brand-white"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[40%] aspect-square w-[min(140vw,72rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_closest-side,rgb(168_184_224/0.2),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-brand-white/10" />
      </div>

      <ScrollReveal className="flex min-h-svh flex-col items-center px-5 pb-12 pt-28 text-center sm:px-8 lg:px-12 lg:pt-36">
        <Eyebrow index="04" className="text-brand-soft-blue">
          The Shots Experience
        </Eyebrow>
        <SplitHeading
          id="experience-cta-heading"
          motion="reveal"
          lines={["Every garment", "has a journey."]}
          lineClassNames={[undefined, "text-brand-yellow"]}
          className="mt-10 text-[clamp(2.8rem,11vw,9.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.05em]"
        />
        <p data-reveal className="mt-8 max-w-[44ch] text-base leading-relaxed text-brand-white/75 lg:text-lg">
          Discover the care, precision and process behind every fresh finish.
        </p>
        <div data-reveal data-reveal-delay="0.1" className="mt-10">
          <ButtonLink href="/experience" arrow>
            Explore the Shots experience
          </ButtonLink>
        </div>

        {/* Journey index */}
        <ol aria-label="The five scenes of the journey" className="mt-auto grid w-full max-w-6xl grid-cols-5 gap-2 pt-20 sm:gap-6">
          {journeyStages.map((stage, index) => (
            <li key={stage.id} data-reveal data-reveal-delay={index * 0.08} className="flex flex-col items-center">
              <div className="flex h-16 items-end sm:h-28 lg:h-36">
                <ElementImage
                  name={stage.element}
                  alt=""
                  sizes="(min-width: 1024px) 120px, 80px"
                  className="h-full opacity-80 transition-[opacity,translate] duration-500 hover:-translate-y-1 hover:opacity-100"
                />
              </div>
              <p className="mt-4 font-mono text-[0.62rem] tabular-nums text-brand-yellow">{formatStep(index + 1)}</p>
              <p className="mt-1 hidden text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-brand-soft-blue sm:block">
                {stage.title}
              </p>
              <span className="sr-only sm:hidden">{stage.title}</span>
            </li>
          ))}
        </ol>
      </ScrollReveal>
    </section>
  );
}
