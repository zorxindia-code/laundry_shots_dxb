import { MessageCircle } from "lucide-react";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { buttonClasses } from "@/components/ui/ButtonLink";
import { Logo } from "@/components/ui/Logo";
import { Sparkle } from "@/components/ui/Sparkle";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { contactDetails, whatsappHref } from "@/config/site";

/** Closing navy band of /contact: "Good clothes deserve good care." */
export function ContactClosing() {
  const { whatsapp } = contactDetails;

  return (
    <section
      data-nav-tone="navy"
      aria-labelledby="contact-closing-heading"
      className="relative isolate overflow-hidden bg-brand-navy text-brand-white"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 aspect-square w-[min(140vw,70rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_closest-side,rgb(168_184_224/0.16),transparent)]" />
      </div>
      <ScrollReveal className="flex flex-col items-center px-5 py-24 text-center sm:px-8 lg:px-12 lg:py-36">
        <div data-reveal className="flex items-center gap-4">
          <Sparkle className="size-4" />
          <Logo className="h-10" />
        </div>
        <SplitHeading
          id="contact-closing-heading"
          motion="reveal"
          lines={["Good clothes", "deserve good care."]}
          lineClassNames={[undefined, "text-brand-yellow"]}
          className="mt-12 text-[clamp(2.6rem,9vw,8rem)] font-bold uppercase leading-[0.9] tracking-[-0.05em]"
        />
        <div data-reveal data-reveal-delay="0.1" className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {whatsapp && (
            <a
              href={whatsappHref(whatsapp, "Hi Shots Laundry, I have a garment-care enquiry.")}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary")}
            >
              <MessageCircle aria-hidden className="size-4" strokeWidth={1.75} />
              WhatsApp us
            </a>
          )}
          <a href="#enquiry" className={buttonClasses(whatsapp ? "outline-light" : "primary")}>
            Send an enquiry
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}
