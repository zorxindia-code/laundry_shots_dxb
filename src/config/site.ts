/**
 * Site-wide configuration used for metadata and SEO defaults.
 */
export const siteConfig = {
  name: "Shots Laundry",
  description:
    "Shots Laundry — premium laundry, ironing and delivery service.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_AE",
} as const;
