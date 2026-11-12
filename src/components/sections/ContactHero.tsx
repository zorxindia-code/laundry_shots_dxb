import { FloatingVisual } from "@/components/animations/FloatingVisual";
import { IntroReveal } from "@/components/animations/IntroReveal";
import { ElementImage } from "@/components/ui/ProductImage";
import { Sparkle } from "@/components/ui/Sparkle";
import { SplitHeading } from "@/components/ui/SplitHeading";

/**
 * Contact hero: oversized "Let's talk about fresh." on navy, with the branded
 * delivery van floating beside it (leans toward the pointer) and an animated
 * scroll cue down to the enquiry layout.
 */
export function ContactHero() {
  return (
    <section
      data-nav-tone="navy"
      aria-labelledby="contact-heading"
      className="relative isolate overflow-hidden bg-brand-navy text-brand-white"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-30%] top-[10%] aspect-square w-[min(130vw,64rem)] rounded-full bg-[radial-gradient(circle_closest-side,rgb(168_184_224/0.2),transparent)] lg:right-[-8%] lg:top-[-10%] lg:w-[58vw]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <IntroReveal className="grid min-h-[92svh] grid-rows-[auto_1fr_auto] px-5 pb-8 pt-28 sm:px-8 lg:grid-cols-12 lg:grid-rows-[1fr_auto] lg:px-12 lg:pb-10 lg:pt-32">
        <div className="relative z-10 flex flex-col justify-center lg:col-span-8 lg:row-start-1">
          <p
            data-intro="fade"
            className="mb-8 flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-brand-soft-blue"
          >
            <span aria-hidden className="h-px w-8 bg-brand-yellow" />
            Contact
          </p>
          <SplitHeading
            as="h1"
            id="contact-heading"
            motion="intro"
            at={0.1}
            lines={["Let's talk", "about fresh."]}
            lineClassNames={[undefined, "text-brand-yellow"]}
            className="text-[clamp(3rem,13vw,5rem)] font-bold uppercase leading-[0.88] tracking-[-0.05em] sm:text-[clamp(4rem,11vw,7rem)] lg:text-[clamp(5rem,9vw,10.5rem)]"
          />
          <p
            data-intro="fade"
            data-intro-at="0.7"
            className="mt-8 max-w-[44ch] text-base leading-relaxed text-brand-white/75 lg:text-lg"
          >
            Have a garment-care enquiry or need help with your laundry? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="pointer-events-none relative flex items-center justify-center py-10 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:py-0">
          <div data-intro="visual" data-intro-at="0.3" className="relative">
            <FloatingVisual>
              <ElementImage
                name="vanRearView"
                preload
                sizes="(min-width: 1024px) 34vw, 70vw"
                className="w-[min(62vw,18rem)] drop-shadow-[0_40px_50px_rgb(0_0_0/0.4)] lg:w-[min(30vw,30rem)]"
              />
            </FloatingVisual>
            <Sparkle className="absolute -left-[8%] -top-[10%] size-6 lg:size-9" />
            <Sparkle className="absolute -left-[1%] top-[2%] size-3 lg:size-4" />
          </div>
        </div>

        {/* Scroll cue */}
        <a
          href="#enquiry"
          data-intro="fade"
          data-intro-at="1.1"
          className="group flex w-fit items-center gap-4 self-end text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-brand-soft-blue transition-colors hover:text-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow lg:col-span-12 lg:row-start-2"
        >
          <span aria-hidden className="relative block h-12 w-px overflow-hidden bg-brand-white/15">
            <span className="absolute left-0 top-0 block h-1/3 w-px bg-brand-yellow motion-safe:animate-[scroll-cue_2.2s_ease-in-out_infinite]" />
          </span>
          Write to us
        </a>
      </IntroReveal>
    </section>
  );
}
