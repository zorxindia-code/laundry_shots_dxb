import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SceneCropImage } from "@/components/ui/ProductImage";
import { SplitHeading } from "@/components/ui/SplitHeading";
import type { SceneCropName } from "@/config/sceneCrops";
import { formatStep } from "@/lib/utils";

const principles = [
  { title: "Care", text: "Every garment is handled as if it were our own." },
  { title: "Precision", text: "Clean lines, crisp collars and attention to the finishing details." },
  { title: "Freshness", text: "Returned clean, pressed and ready for what's next." },
] as const;

const diptych: { crop: SceneCropName; label: string; caption: string; offset: string; parallax: string }[] = [
  { crop: "stainedFabric", label: "Before", caption: "As it arrives", offset: "", parallax: "30" },
  { crop: "freshFabric", label: "After", caption: "As it leaves", offset: "lg:mt-32", parallax: "-30" },
];

/**
 * "The SHOTS Difference": the brand's approach in editorial copy, a
 * before/after fabric diptych (close-ups cropped from the journey scenes) and
 * three principles. Navy with white contrast.
 */
export function BrandStorySection() {
  return (
    <section
      data-nav-tone="navy"
      aria-labelledby="difference-heading"
      className="relative overflow-hidden bg-brand-navy text-brand-white"
    >
      <ScrollReveal className="px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow index="02" className="text-brand-soft-blue" >
              The Shots Difference
            </Eyebrow>
            <SplitHeading
              id="difference-heading"
              motion="reveal"
              lines={["Not just clean.", "Carefully crafted."]}
              lineClassNames={[undefined, "text-brand-soft-blue"]}
              className="mt-8 text-[clamp(2.6rem,9vw,7rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em]"
            />
          </div>
          <div className="flex flex-col justify-end gap-6 text-base leading-relaxed text-brand-white/75 lg:col-span-4 lg:col-start-9 lg:text-lg">
            <p data-reveal>
              At Shots, laundry is a craft. Every garment is looked at, cleaned with care, finished with
              precision and returned fresh.
            </p>
            <p data-reveal data-reveal-delay="0.1">
              Because the clothes you wear every day deserve the same attention as the ones you save for
              special days.
            </p>
          </div>
        </div>

        {/* Before / after */}
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:mt-28 lg:grid-cols-12 lg:gap-8">
          {diptych.map((item, index) => (
            <figure
              key={item.crop}
              data-reveal
              data-reveal-delay={index * 0.12}
              className={index === 0 ? `lg:col-span-5 lg:col-start-2 ${item.offset}` : `lg:col-span-5 lg:col-start-7 ${item.offset}`}
            >
              <div className="relative overflow-hidden">
                <div data-parallax={item.parallax} className="scale-[1.12]">
                  <SceneCropImage
                    name={item.crop}
                    sizes="(min-width: 1024px) 190vw, (min-width: 640px) 260vw, 520vw"
                    className="w-full"
                  />
                </div>
                <span className="absolute left-4 top-4 rounded-full bg-brand-navy/85 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-brand-white backdrop-blur-sm">
                  {item.label}
                </span>
              </div>
              <figcaption className="mt-4 flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-brand-soft-blue">
                <span className="font-mono tabular-nums">{formatStep(index + 1)}</span>
                <span aria-hidden className="h-px w-6 bg-brand-yellow" />
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Principles */}
        <ol className="mt-20 grid border-t border-brand-white/10 lg:mt-28 lg:grid-cols-3">
          {principles.map((item, index) => (
            <li
              key={item.title}
              data-reveal
              data-reveal-delay={index * 0.1}
              className="border-b border-brand-white/10 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:py-10 lg:first:pl-0 lg:last:border-r-0"
            >
              <p className="font-mono text-[0.66rem] tabular-nums text-brand-yellow">{formatStep(index + 1)}</p>
              <h3 className="mt-4 text-2xl font-semibold uppercase tracking-[-0.02em] lg:text-3xl">{item.title}</h3>
              <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-brand-white/65 lg:text-base">{item.text}</p>
            </li>
          ))}
        </ol>
      </ScrollReveal>
    </section>
  );
}
