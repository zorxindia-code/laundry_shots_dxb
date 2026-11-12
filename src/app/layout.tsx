import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Navbar } from "@/components/layout/Navbar";
import { brandColors } from "@/config/brand";
import { siteConfig } from "@/config/site";

import "./globals.css";

// Interim typefaces until the brand fonts are added to `public/fonts/`.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: "/",
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: brandColors.midnightNavy,
  colorScheme: "dark",
};

/**
 * Marks <html> as JS-enabled before first paint, so hero entrance items can
 * start hidden (see globals.css) without a flash — and stay visible when
 * JavaScript is unavailable. Rendered as text/plain on the client so React
 * doesn't re-run it (see the "Preventing flash before hydration" guide).
 */
function JsFlag() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: "document.documentElement.setAttribute('data-js','')" }}
    />
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The inline script adds `data-js` before hydration.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsFlag />
        <a
          href="#main-content"
          className="sr-only z-[60] rounded-full bg-brand-yellow px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-navy focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
