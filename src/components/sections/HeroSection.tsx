import { IntroReveal } from "@/components/animations/IntroReveal";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ElementImage } from "@/components/ui/ProductImage";
import { Sparkle } from "@/components/ui/Sparkle";
import { SplitHeading } from "@/components/ui/SplitHeading";

/**
 * Home hero: full-viewport midnight navy, an oversized editorial headline and
 * the clean shirt on its hanger as the product visual, lit by a soft blue
 * glow with yellow sparkle accents from the logo.
 *
 * Entrance (IntroReveal): headline words → supporting copy → product → CTAs.
 * On scroll the product and copy drift apart slightly (ScrollReveal parallax).
 */
export function HeroSection() {
  return (
    <section
      data-nav-tone="navy"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-brand-navy text-brand-white"
    >
      {/* Atmosphere: soft blue key light behind the product, a darker floor, faint grid lines. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-18%] top-[8%] aspect-square w-[min(120vw,70rem)] rounded-full bg-[radial-gradient(circle_closest-side,rgb(168_184_224/0.22),rgb(168_184_224/0.06)_55%,transparent)] lg:right-[-6%] lg:top-[-4%] lg:w-[64vw]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="absolute inset-y-0 left-[33.333%] hidden w-px bg-brand-white/[0.05] lg:block" />
        <div className="absolute inset-y-0 left-[66.666%] hidden w-px bg-brand-white/[0.05] lg:block" />
      </div>

      <ScrollReveal>
        <IntroReveal className="relative mx-auto grid min-h-svh w-full grid-rows-[1fr_auto] px-5 pb-8 pt-24 sm:px-8 lg:grid-cols-12 lg:grid-rows-[1fr_auto] lg:px-12 lg:pb-10 lg:pt-28">
          {/* Product visual */}
          <div className="pointer-events-none relative row-start-1 flex items-center justify-center lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div data-parallax="-50" className="relative">
              <div data-intro="visual" data-intro-at="0.35" className="relative">
                <ElementImage
                  name="shirtOnHanger"
                  preload
                  sizes="(min-width: 1024px) 40vw, 70vw"
                  className="h-[min(40svh,60vw)] drop-shadow-[0_40px_60px_rgb(0_0_0/0.35)] sm:h-[44svh] lg:h-[min(70svh,50vw)]"
                />
                <Sparkle className="absolute -left-[12%] top-[6%] size-6 lg:size-9" />
                <Sparkle className="absolute -left-[3%] top-[15%] size-3 lg:size-4" />
              </div>
            </div>
          </div>

          {/* Copy */}
          <div data-parallax="30" className="relative z-10 row-start-2 flex flex-col justify-end lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:pb-[6svh]">
            <p
              data-intro="fade"
              data-intro-at="0.05"
              className="mb-6 flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-brand-soft-blue lg:mb-8"
            >
              <span aria-hidden className="h-px w-8 bg-brand-yellow" />
              Premium garment care
            </p>
            <SplitHeading
              as="h1"
              id="hero-heading"
              motion="intro"
              at={0.15}
              lines={["Care that goes", "beyond clean."]}
              lineClassNames={[undefined, "text-brand-soft-blue"]}
              className="text-[clamp(3rem,12.5vw,4.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.045em] sm:text-[clamp(4rem,10vw,6rem)] lg:text-[clamp(4.5rem,6.6vw,8.5rem)]"
            />
            <p
              data-intro="fade"
              data-intro-at="0.75"
              className="mt-6 max-w-[38ch] text-base leading-relaxed text-brand-white/75 lg:mt-8 lg:text-lg"
            >
              More than laundry. A thoughtful approach to garment care, precision and freshness.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 lg:mt-10">
              <div data-intro="fade" data-intro-at="0.95">
                <ButtonLink href="/experience" arrow>
                  Explore the experience
                </ButtonLink>
              </div>
              <div data-intro="fade" data-intro-at="1.05">
                <ButtonLink href="/contact" variant="text-light" className="min-h-12 underline-offset-8 hover:underline">
                  Get in touch
                </ButtonLink>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div
            data-intro="fade"
            data-intro-at="1.25"
            className="row-start-3 mt-10 hidden items-end justify-between border-t border-brand-white/10 pt-5 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-brand-soft-blue lg:col-span-12 lg:row-start-3 lg:flex"
          >
            <span>Care · Precision · Freshness</span>
            <span className="flex items-center gap-4">
              Scroll
              <span aria-hidden className="relative block h-8 w-px overflow-hidden bg-brand-white/15">
                <span className="absolute left-0 top-0 block h-1/3 w-px bg-brand-yellow motion-safe:animate-[scroll-cue_2.2s_ease-in-out_infinite]" />
              </span>
            </span>
          </div>
        </IntroReveal>
      </ScrollReveal>
    </section>
  );
}
