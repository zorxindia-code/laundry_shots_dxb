import { ArrowUpRight, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { contactDetails, socialLinks, telHref, whatsappHref } from "@/config/site";

const linkClass =
  "underline-offset-8 transition-colors duration-300 hover:text-brand-yellow hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow";

/** Shown for any detail not yet configured in `src/config/site.ts`. */
function Pending() {
  return <span className="text-brand-soft-blue/60">To be confirmed</span>;
}

/**
 * Left side of the contact layout: editorial heading and the business's
 * contact details from `contactDetails` / `socialLinks`. Nothing is invented —
 * unconfigured details read "To be confirmed", and the WhatsApp card only
 * appears once a number is set.
 */
export function ContactDetails() {
  const { phone, whatsapp, email, address, hours, mapUrl, mapEmbedUrl } = contactDetails;

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Phone", value: phone ? <a href={telHref(phone)} className={linkClass}>{phone}</a> : <Pending /> },
    {
      label: "WhatsApp",
      value: whatsapp ? (
        <a href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Chat with us
        </a>
      ) : (
        <Pending />
      ),
    },
    { label: "Email", value: email ? <a href={`mailto:${email}`} className={`${linkClass} break-all`}>{email}</a> : <Pending /> },
    {
      label: "Address",
      value: address ? (
        <span>
          {address.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} mt-2 inline-flex items-center gap-1 text-sm text-brand-yellow`}>
              Open in maps <ArrowUpRight aria-hidden className="size-4" />
            </a>
          )}
        </span>
      ) : (
        <Pending />
      ),
    },
    {
      label: "Opening hours",
      value: hours ? hours.map((line) => <span key={line} className="block">{line}</span>) : <Pending />,
    },
  ];

  return (
    <div>
      <Eyebrow index="01" className="text-brand-soft-blue">
        Contact details
      </Eyebrow>
      <SplitHeading
        motion="reveal"
        lines={["We're just", "a message away."]}
        lineClassNames={[undefined, "text-brand-soft-blue"]}
        className="mt-8 text-[clamp(2.4rem,6.5vw,5rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em]"
      />

      <dl className="mt-12 grid border-t border-brand-white/10">
        {rows.map((row, index) => (
          <div
            key={row.label}
            data-reveal
            data-reveal-delay={index * 0.05}
            className="grid grid-cols-[8.5rem_1fr] gap-4 border-b border-brand-white/10 py-5 text-base sm:grid-cols-[10rem_1fr]"
          >
            <dt className="pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-brand-soft-blue">{row.label}</dt>
            <dd className="min-w-0">{row.value}</dd>
          </div>
        ))}
        {socialLinks.length > 0 && (
          <div data-reveal className="grid grid-cols-[8.5rem_1fr] gap-4 border-b border-brand-white/10 py-5 sm:grid-cols-[10rem_1fr]">
            <dt className="pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-brand-soft-blue">Social</dt>
            <dd className="flex flex-wrap gap-x-6 gap-y-2">
              {socialLinks.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {link.label}
                </a>
              ))}
            </dd>
          </div>
        )}
      </dl>

      {mapEmbedUrl && (
        <figure data-reveal className="mt-10">
          <div className="relative overflow-hidden border border-brand-white/10 bg-brand-white/5">
            <iframe
              src={mapEmbedUrl}
              title="Shots Laundry on Google Maps"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="block h-[16rem] w-full border-0 sm:h-[18rem] lg:h-[19rem]"
            />
            <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-16 bg-brand-yellow" />
          </div>
          <figcaption className="mt-3 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-brand-soft-blue">
            Find us
          </figcaption>
        </figure>
      )}

      {whatsapp && <WhatsAppCard number={whatsapp} />}
    </div>
  );
}

/** Prominent WhatsApp CTA (only rendered when a verified number is configured). */
export function WhatsAppCard({ number }: { number: string }) {
  return (
    <a
      data-reveal
      href={whatsappHref(number, "Hi Shots Laundry, I have a garment-care enquiry.")}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-10 flex items-center justify-between gap-6 rounded-full border border-brand-yellow/40 py-3 pl-3 pr-6 transition-colors duration-300 hover:bg-brand-yellow hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow"
    >
      <span className="flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-yellow text-brand-navy">
          <MessageCircle aria-hidden className="size-5" strokeWidth={1.75} />
        </span>
        <span>
          <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.28em] opacity-70">Prefer to chat?</span>
          <span className="block text-lg font-semibold">Message us on WhatsApp</span>
        </span>
      </span>
      <ArrowUpRight aria-hidden className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}
