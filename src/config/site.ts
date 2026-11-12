/**
 * Site-wide configuration: metadata defaults, navigation and business
 * contact details.
 */
export const siteConfig = {
  name: "Shots Laundry",
  description:
    "Shots Laundry — premium laundry, ironing and delivery service.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_AE",
} as const;

export interface NavItem {
  href: "/" | "/experience" | "/contact";
  label: string;
}

/** Primary navigation, shared by the navbar, mobile menu and footer. */
export const navigation: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/experience", label: "The Experience" },
  { href: "/contact", label: "Contact" },
];

/* -------------------------------------------------------------------------- */
/*  Business contact details                                                  */
/* -------------------------------------------------------------------------- */
/*
 * ⚠️ PLACEHOLDERS — fill in with VERIFIED business information before launch.
 *
 * Every field is `null` until confirmed. The UI never invents values: a `null`
 * field is shown as "To be confirmed" on the contact page and omitted from
 * the footer, and the WhatsApp CTAs only appear once `whatsapp` is set.
 */
export interface ContactDetails {
  /** Display format, e.g. "+971 4 000 0000". Used for a `tel:` link. */
  phone: string | null;
  /** International format, digits only (no "+", spaces or dashes), for wa.me links. */
  whatsapp: string | null;
  email: string | null;
  /** Address lines, e.g. ["Building, Street", "Area, City"]. */
  address: readonly string[] | null;
  /** Opening hours lines, e.g. ["Mon–Sat · 8:00–21:00"]. */
  hours: readonly string[] | null;
  /** Optional maps link for the address. */
  mapUrl: string | null;
  /** Google Maps embed URL (the `src` of the "Share → Embed a map" iframe). */
  mapEmbedUrl: string | null;
}

export const contactDetails: ContactDetails = {
  phone: null, // TODO: verified phone number
  whatsapp: null, // TODO: verified WhatsApp number (digits only)
  email: null, // TODO: verified enquiries email
  address: null, // TODO: verified business address
  hours: null, // TODO: verified opening hours
  mapUrl: null, // TODO: optional maps link
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4638.302088145405!2d55.3927519!3d24.9843805!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f7bd53cd76215%3A0x92ccc951ddec464!2sShots%20Laundry!5e1!3m2!1sen!2sin!4v1794472731508!5m2!1sen!2sin",
};

export interface SocialLink {
  label: string;
  href: string;
}

/** Social profiles. Empty until verified links are added; sections hide when empty. */
export const socialLinks: readonly SocialLink[] = [
  // { label: "Instagram", href: "https://instagram.com/…" },
];

/** `tel:` href from a display phone number. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** WhatsApp chat link for a digits-only number, with an optional prefilled message. */
export const whatsappHref = (number: string, text?: string) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
