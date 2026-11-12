import { cacheLife } from "next/cache";
import Link from "next/link";

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

/** Shorter labels for the compact footer navigation. */
const footerLabel = (href: string, label: string) => (href === "/experience" ? "Experience" : label);

/**
 * Compact global footer:
 * - top row: logo · navigation;
 * - brand statement (and the address, once configured) — omitted by the
 *   `minimal` variant used after the experience journey;
 * - bottom row: copyright · social / contact links.
 * Contact links appear as soon as they are set in `src/config/site.ts`; until
 * then the enquiry link stands in.
 */
export async function Footer({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const year = await getCopyrightYear();
  const { phone, whatsapp, email, address } = contactDetails;

  const links = [
    ...socialLinks.map((link) => ({ ...link, external: true })),
    ...(phone ? [{ label: phone, href: telHref(phone), external: false }] : []),
    ...(whatsapp ? [{ label: "WhatsApp", href: whatsappHref(whatsapp), external: true }] : []),
    ...(email ? [{ label: email, href: `mailto:${email}`, external: false }] : []),
  ];

  return (
    <footer data-nav-tone="navy" className="border-t border-brand-white/10 bg-brand-navy text-brand-white">
      <div className="px-5 sm:px-8 lg:px-12">
        {/* Top row */}
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-8 lg:py-9">
          <Link
            href="/"
            aria-label={`${siteConfig.name} — home`}
            className="w-fit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow"
          >
            <Logo className="h-8" />
          </Link>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-7 gap-y-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {footerLabel(item.href, item.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Brand statement */}
        {variant === "full" && (
          <div className="-mt-2 flex flex-col gap-1.5 pb-7 text-sm text-brand-soft-blue sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="flex items-center gap-2.5">
              <Sparkle className="size-2.5 shrink-0" />A thoughtful approach to garment care, precision and freshness.
            </p>
            {address && <p className="text-xs">{address.join(", ")}</p>}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex flex-col gap-2 border-t border-brand-white/10 py-5 text-xs text-brand-soft-blue sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {links.length > 0 ? (
              links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={cn("text-brand-white/80", linkClass)}
                  >
                    {link.label}
                  </a>
                </li>
              ))
            ) : (
              <li>
                <Link href="/contact" className={cn("text-brand-white/80", linkClass)}>
                  Send us an enquiry
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
