import { cacheLife } from "next/cache";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/Logo";
import { Sparkle } from "@/components/ui/Sparkle";
import { contactDetails, navigation, siteConfig, socialLinks, telHref, whatsappHref } from "@/config/site";
import { cn } from "@/lib/utils";

/** Copyright year, cached so the footer stays prerenderable. */
async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const linkClass =
  "transition-colors duration-300 hover:text-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow";

/**
 * Global footer. `full` (Home, Contact): wordmark, navigation, contact and
 * social links. `minimal` (Experience): a single quiet row, so the immersive
 * journey and its closing CTA stay the focus.
 */
export async function Footer({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const year = await getCopyrightYear();
  const copyright = `© ${year} ${siteConfig.name}. All rights reserved.`;

  if (variant === "minimal") {
    return (
      <footer data-nav-tone="navy" className="border-t border-brand-white/10 bg-brand-navy text-brand-white">
        <div className="flex flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link href="/" aria-label={`${siteConfig.name} — home`} className="w-fit">
            <Logo className="h-8" />
          </Link>
          <FooterNav className="flex flex-wrap gap-x-8 gap-y-3" />
          <p className="text-xs text-brand-soft-blue">{copyright}</p>
        </div>
      </footer>
    );
  }

  const { phone, whatsapp, email, address } = contactDetails;
  const hasContact = Boolean(phone || whatsapp || email || address);

  return (
    <footer data-nav-tone="navy" className="relative overflow-hidden bg-brand-navy text-brand-white">
      <div className="grid gap-12 border-t border-brand-white/10 px-5 pb-10 pt-16 sm:px-8 md:grid-cols-12 lg:px-12 lg:pt-24">
        <div className="md:col-span-5">
          <Link href="/" aria-label={`${siteConfig.name} — home`} className="block w-fit">
            <Logo className="h-11" />
          </Link>
          <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-brand-soft-blue">
            A thoughtful approach to garment care, precision and freshness.
          </p>
        </div>

        <FooterColumn title="Navigate" className="md:col-span-2">
          <FooterNav className="grid gap-3" />
        </FooterColumn>

        <FooterColumn title="Contact" className="md:col-span-3">
          {hasContact ? (
            <ul className="grid gap-3 text-sm">
              {phone && (
                <li>
                  <a href={telHref(phone)} className={linkClass}>
                    {phone}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    WhatsApp
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className={linkClass}>
                    {email}
                  </a>
                </li>
              )}
              {address && <li className="text-brand-soft-blue">{address.join(", ")}</li>}
            </ul>
          ) : (
            <Link href="/contact" className={cn("text-sm", linkClass)}>
              Send us an enquiry
            </Link>
          )}
        </FooterColumn>

        {socialLinks.length > 0 && (
          <FooterColumn title="Follow" className="md:col-span-2">
            <ul className="grid gap-3 text-sm">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </FooterColumn>
        )}
      </div>

      {/* Oversized wordmark */}
      <div aria-hidden className="relative select-none px-3 sm:px-5 lg:px-8">
        <p className="text-center text-[29vw] font-bold uppercase leading-[0.74] tracking-[-0.07em] text-brand-white/[0.06]">
          Shots
        </p>
        <Sparkle className="absolute right-[7%] top-[6%] size-[3.5vw] min-w-4" />
      </div>

      <div className="flex flex-col gap-2 border-t border-brand-white/10 px-5 py-6 text-xs text-brand-soft-blue sm:flex-row sm:justify-between sm:px-8 lg:px-12">
        <p>{copyright}</p>
        <p>Care that goes beyond clean.</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <h2 className="mb-5 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-brand-soft-blue">{title}</h2>
      {children}
    </div>
  );
}

function FooterNav({ className }: { className?: string }) {
  return (
    <nav aria-label="Footer">
      <ul className={cn("text-sm", className)}>
        {navigation.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
