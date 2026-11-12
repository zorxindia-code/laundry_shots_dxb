# Shots Laundry

Website for **Shots Laundry**, a premium laundry service.

Built with Next.js (App Router), React, TypeScript, Tailwind CSS v4, GSAP + ScrollTrigger and Lucide icons.

## Getting started

Requires Node.js 20.9+ (developed on Node 22).

```bash
npm install
cp .env.example .env.local   # optional, set NEXT_PUBLIC_SITE_URL
npm run dev                  # http://localhost:3000
```

## Scripts

| Command             | Description                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Start the development server                    |
| `npm run build`     | Create a production build                       |
| `npm run start`     | Serve the production build                      |
| `npm run lint`      | Run ESLint                                      |
| `npm run typecheck` | Generate route types and run the TypeScript check |

## Routes

| Route         | Page                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| `/`           | Cinematic landing page: hero, The Shots Difference, services preview, experience and contact CTAs |
| `/experience` | The laundry journey video as a scroll-controlled frame sequence (`LaundryFrameSequence`) and a closing CTA to Contact |
| `/contact`    | Editorial contact page: details, enquiry form, closing CTA                             |

## Project structure

```
src/
├── app/                  Routes (/, /experience, /contact), root layout + navbar,
│                         template (page transition), sitemap/robots, 404/error
│   └── contact/actions.ts   Enquiry server action (form delivery boundary)
├── components/
│   ├── layout/           Navbar, Footer, PageTransition
│   ├── sections/         Page sections incl. LaundryFrameSequence (the journey)
│   ├── animations/       IntroReveal, ScrollReveal, FloatingVisual (GSAP)
│   └── ui/               ButtonLink, CroppedImage, ProductImage, Logo, SplitHeading, …
├── lib/                  Utilities (`cn`), the GSAP entry point, enquiry validation,
│                         frame-store (progressive frame loader + bounded decode cache)
├── config/               Brand tokens, site/nav/contact details, journey stages,
│                         elements, services, scene crops
├── types/                Shared TypeScript types
└── styles/               Tailwind theme tokens (`theme.css`)

public/
├── images/brand/         Shots Laundry logo
├── images/laundry-journey/  The five main scroll-scene JPGs (config: src/config/journey.ts)
├── images/elements/  Individual transparent PNG elements (config: src/config/elements.ts)
├── images/laundry-frames/  Lossless WebP frames of videos/Web.mp4 (generated)
├── videos/Web.mp4    Source of the journey animation (never modified)
├── icons/
└── fonts/                Self-hosted brand fonts
```

Images are never edited: the logo, PNG elements and scene close-ups are cropped
in CSS from the original files (`CroppedImage`).

## Journey frames

`/experience` plays `public/videos/Web.mp4` frame by frame from lossless WebP
frames, driven by scroll (one canvas, GSAP ScrollTrigger). After replacing the
video, regenerate the frames, the manifest (`src/config/video-frames.ts`) and the
validation report (`docs/laundry-frames-report.md`):

```bash
node scripts/extract-frames.mjs           # extract + encode + validate + manifest
node scripts/extract-frames.mjs --verify  # re-validate existing frames only
```

Requires FFmpeg (`ffmpeg`, `ffprobe`) and libwebp (`cwebp`, `dwebp`, `webpinfo`).

## Before launch

1. **Business details** — fill in `contactDetails` and `socialLinks` in
   `src/config/site.ts` with verified information. Until then the contact page
   shows "To be confirmed" and WhatsApp CTAs stay hidden.
2. **Enquiry delivery** — set `CONTACT_FORM_ENDPOINT` (and optionally
   `CONTACT_FORM_TOKEN`) on the server; see `.env.example`. Without it the form
   tells visitors online enquiries aren't connected and sends nothing.
3. **Services** — confirm the categories in `src/config/services.ts`.
4. **Site URL** — set `NEXT_PUBLIC_SITE_URL` for canonical/Open Graph URLs.

## Conventions

- **Components:** PascalCase file names matching the export (`HeroSection.tsx`). Server Components by default; add `"use client"` only where interactivity or GSAP is needed.
- **Imports:** use the `@/` alias for anything under `src/` (`@/config/brand`).
- **Brand colours:** defined in `src/styles/theme.css` (Tailwind utilities like `bg-brand-navy`) and mirrored in `src/config/brand.ts` for JavaScript. Keep both in sync.
- **GSAP:** import `gsap` and `ScrollTrigger` from `@/lib/gsap`, which registers plugins once.

## Brand colours

| Token              | Hex       | Tailwind utility suffix |
| ------------------ | --------- | ----------------------- |
| Midnight Navy      | `#06175E` | `brand-navy`            |
| Bright Yellow      | `#FFF000` | `brand-yellow`          |
| White              | `#FFFFFF` | `brand-white`           |
| Light Blue         | `#EAF5FC` | `brand-light-blue`      |
| Soft Blue          | `#A8B8E0` | `brand-soft-blue`       |

## Laundry journey stages

Defined in `src/config/journey.ts`, each mapped to `public/images/laundry-journey/shots-laundry-website-images-0N.jpg`:

1. Dirty Clothes
2. Washing Machine
3. Ironing
4. Delivery
5. Fresh Clothes
