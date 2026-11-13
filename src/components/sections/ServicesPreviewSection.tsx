import Link from "next/link";

import { ActiveRowList } from "@/components/animations/ActiveRowList";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ButtonArrow } from "@/components/ui/ButtonLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ElementImage, SceneCropImage } from "@/components/ui/ProductImage";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { services, type Service } from "@/config/services";
import { cn, formatStep } from "@/lib/utils";

/**
 * Premium services preview: an editorial list of service categories on
 * alternating white and navy bands, each with an oversized outlined number,
 * its product image and a subtle hover (number fills, image lifts, rule
 * extends). A preview only — the full journey lives on /experience.
 */
export function ServicesPreviewSection() {
  return (
    <section aria-labelledby="services-heading" className="relative">
      <div data-nav-tone="navy" className="bg-brand-navy text-brand-white">
        <ScrollReveal className="grid gap-8 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-12 lg:px-12 lg:pb-24">
          <div className="lg:col-span-7">
            <Eyebrow index="03" className="text-brand-soft-blue">
              Services
            </Eyebrow>
            <SplitHeading
              id="services-heading"
              motion="reveal"
              lines={["Care for", "every garment."]}
              className="mt-8 text-[clamp(2.6rem,9vw,7rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em]"
            />
          </div>
          <p
            data-reveal
            className="max-w-[40ch] self-end text-base leading-relaxed text-brand-white/70 lg:col-span-4 lg:col-start-9 lg:text-lg"
          >
            From everyday essentials to the pieces you treasure — a closer look at how Shots looks after your
            wardrobe.
          </p>
        </ScrollReveal>
      </div>

      {/* Touch devices: the row in the middle of the screen gets the hover look. */}
      <ActiveRowList>
        {services.map((service, index) => (
          <ServiceRow key={service.id} service={service} index={index} />
        ))}
      </ActiveRowList>
    </section>
  );
}

function ServiceRow({ service, index }: { service: Service; index: number }) {
  const light = index % 2 === 0;
  const flip = index % 2 === 1;

  return (
    <li
      data-active-row
      data-nav-tone={light ? "light" : "navy"}
      className={cn("group relative overflow-hidden", light ? "bg-brand-white text-brand-navy" : "bg-brand-navy text-brand-white")}
    >
      <ScrollReveal className="grid items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-24">
        {/* Copy */}
        <div className={cn("lg:col-span-6", flip ? "lg:col-start-7 lg:row-start-1" : "lg:col-start-1")}>
          <div data-reveal className="flex items-start gap-6 lg:gap-10">
            <span
              aria-hidden
              className={cn(
                "text-[clamp(4.5rem,11vw,10rem)] font-bold leading-[0.8] tracking-[-0.06em] text-transparent transition-colors duration-700 motion-reduce:transition-none",
                light
                  ? "[-webkit-text-stroke:1.5px_rgb(6_23_94/0.35)] row-active:text-brand-navy"
                  : "[-webkit-text-stroke:1.5px_rgb(255_255_255/0.3)] row-active:text-brand-yellow row-active:[-webkit-text-stroke-color:transparent]",
              )}
            >
              {formatStep(index + 1)}
            </span>
            <div className="pt-2">
              <p className={cn("font-mono text-[0.66rem] tabular-nums", light ? "text-brand-navy/50" : "text-brand-soft-blue")}>
                <span className="sr-only">Service </span>
                {formatStep(index + 1)} / {formatStep(services.length)}
              </p>
              <h3 className="mt-3 text-[clamp(1.75rem,3.4vw,3rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em]">
                {service.title}
              </h3>
              <span
                aria-hidden
                className={cn(
                  "mt-6 block h-0.5 w-10 transition-[width] duration-700 row-active:w-24 motion-reduce:transition-none",
                  light ? "bg-brand-navy" : "bg-brand-yellow",
                )}
              />
              <p className={cn("mt-6 max-w-[40ch] text-base leading-relaxed", light ? "text-brand-navy/70" : "text-brand-white/70")}>
                {service.summary}
              </p>
              <Link
                href="/contact#enquiry"
                className={cn(
                  "group/link mt-8 inline-flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] underline-offset-8 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow",
                  light ? "text-brand-navy" : "text-brand-yellow",
                )}
              >
                Enquire<span className="sr-only"> about {service.title}</span>
                <ButtonArrow className="row-active:translate-x-1 group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Visual */}
        <div
          className={cn(
            "relative flex min-h-[18rem] items-center justify-center lg:col-span-5 lg:min-h-[28rem]",
            flip ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-8",
          )}
        >
          <div
            aria-hidden
            className={cn(
              "absolute aspect-square w-[min(90%,26rem)] rounded-full",
              light
                ? "bg-[radial-gradient(circle_closest-side,var(--color-brand-light-blue),transparent)]"
                : "bg-[radial-gradient(circle_closest-side,rgb(168_184_224/0.16),transparent)]",
            )}
          />
          <div data-parallax="24" className="relative">
            <div
              data-reveal
              data-reveal-delay="0.1"
              className="transition-transform duration-700 ease-out row-active:-translate-y-2 row-active:scale-[1.03] motion-reduce:transition-none"
            >
              <ServiceVisual service={service} />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </li>
  );
}

function ServiceVisual({ service }: { service: Service }) {
  const { visual } = service;
  if (visual.kind === "crop") {
    return (
      <span className="relative block">
        <SceneCropImage
          name={visual.name}
          sizes="(min-width: 1024px) 130vw, 400vw"
          className="h-[clamp(16rem,46vw,22rem)] lg:h-[min(30rem,56svh)]"
        />
        <span aria-hidden className="absolute -bottom-3 -right-3 h-16 w-16 border-b-2 border-r-2 border-brand-yellow" />
      </span>
    );
  }
  return (
    <ElementImage
      name={visual.name}
      sizes="(min-width: 1024px) 34vw, 80vw"
      className="h-[clamp(14rem,44vw,20rem)] drop-shadow-[0_30px_40px_rgb(6_23_94/0.25)] lg:h-[min(27rem,52svh)]"
    />
  );
}
