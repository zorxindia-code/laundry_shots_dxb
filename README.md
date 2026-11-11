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

## Project structure

```
src/
├── app/                  Routes, root layout, metadata, loading/error/404
├── components/
│   ├── layout/           Navbar, Footer, MobileMenu
│   ├── sections/         HeroSection, LaundryJourney, Services, Process,
│   │                     WhyChooseUs, Testimonials, Contact, Booking
│   ├── animations/       AnimationProvider, SmoothScroll, ScrollProgress
│   └── ui/               Button, Container, SectionHeading
├── hooks/                Reusable React hooks
├── lib/                  Utilities (`cn`) and the GSAP entry point
├── config/               Brand tokens, site config, journey stages
├── types/                Shared TypeScript types
└── styles/               Tailwind theme tokens (`theme.css`)

public/
├── images/brand/         Shots Laundry logo
├── images/laundry-journey/  The five main scroll-scene JPGs (config: src/config/journey.ts)
├── images/elements/  Individual transparent PNG elements (config: src/config/elements.ts)
├── icons/
└── fonts/                Self-hosted brand fonts
```

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

## Laundry journey stages

Defined in `src/config/journey.ts`, each mapped to `public/images/laundry-journey/shots-laundry-website-images-0N.jpg`:

1. Dirty Clothes
2. Washing Machine
3. Ironing
4. Delivery
5. Fresh Clothes
