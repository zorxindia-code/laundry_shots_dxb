"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { AdaptiveLogo } from "@/components/ui/Logo";
import { Sparkle } from "@/components/ui/Sparkle";
import { navigation, siteConfig } from "@/config/site";
import { cn, formatStep } from "@/lib/utils";

/**
 * Tone of the section under the bar, from the nearest `data-nav-tone` ancestor
 * ("navy" | "yellow" | "light"). Sections and journey panels declare it.
 */
type Tone = "navy" | "yellow" | "light";

/** Scroll distance before the bar may hide, and the jitter it ignores. */
const HIDE_AFTER = 140;
const SCROLL_JITTER = 6;

/**
 * Minimal global navigation, fixed over the page (it never takes layout space,
 * so it cannot affect section or animation measurements).
 *
 * - Adapts to the section beneath it: light text/logo over navy, navy over
 *   yellow or white; a subtle translucent backdrop appears once scrolled.
 * - Hides while scrolling down, returns when scrolling up or on focus.
 * - Immersive zones (`data-nav-immersive`, the experience animation): no
 *   backdrop, so it never veils the products; on small screens, where it
 *   would overlap the animation's copy, it stays hidden inside the zone.
 */
export function Navbar() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();
  const [tone, setTone] = useState<Tone>("navy");
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [open, setOpen] = useState(false);

  // Scroll-driven state: tone under the bar, hide/show, immersive zone.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const small = window.matchMedia("(max-width: 1023px)");
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const barHeight = header.offsetHeight;

      // Section under the bar's vertical centre (skipping the bar itself).
      const probe = document
        .elementsFromPoint(window.innerWidth / 2, barHeight / 2)
        .find((el) => !header.contains(el))
        ?.closest<HTMLElement>("[data-nav-tone]");
      const next = probe?.dataset.navTone;
      if (next === "navy" || next === "yellow" || next === "light") setTone(next);

      // Inside an immersive zone once its content has started moving.
      const zone = document.querySelector<HTMLElement>("[data-nav-immersive]");
      const rect = zone?.getBoundingClientRect();
      const inZone = Boolean(rect && rect.top < -40 && rect.bottom > barHeight);
      setImmersive(inZone);

      const delta = y - lastY;
      if (inZone && small.matches) setHidden(true);
      else if (y < HIDE_AFTER) setHidden(false);
      else if (delta > SCROLL_JITTER) setHidden(true);
      else if (delta < -SCROLL_JITTER) setHidden(false);
      if (Math.abs(delta) > SCROLL_JITTER || y < HIDE_AFTER) lastY = y;

      setScrolled(y > 24);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  // Mobile menu: lock page scroll and close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onLight = !open && tone !== "navy";
  const showBackdrop = scrolled && !immersive && !open;
  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        ref={headerRef}
        data-site-nav
        onFocusCapture={() => setHidden(false)}
        className={cn(
          "nav-enter fixed inset-x-0 top-0 z-50 transition-[translate,color,background-color,box-shadow] duration-500 ease-out motion-reduce:transition-none",
          hidden && !open && "-translate-y-full",
          onLight ? "text-brand-navy" : "text-brand-white",
          showBackdrop &&
            (tone === "navy"
              ? "bg-brand-navy/80 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-md"
              : tone === "yellow"
                ? "bg-brand-yellow/85 backdrop-blur-md"
                : "bg-brand-white/85 shadow-[0_1px_0_rgb(6_23_94/0.08)] backdrop-blur-md"),
        )}
      >
        <nav
          aria-label="Primary"
          className="flex h-16 items-center justify-between gap-6 px-5 pt-[env(safe-area-inset-top)] sm:px-8 lg:h-20 lg:px-12"
        >
          <Link
            href="/"
            aria-label={`${siteConfig.name} — home`}
            onClick={() => setOpen(false)}
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow"
          >
            <AdaptiveLogo tone={onLight ? "dark" : "light"} className="h-9 lg:h-10" />
          </Link>

          <ul className="hidden items-center gap-10 md:flex">
            {navigation.map((item) => {
              const current = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className="group relative block py-2 text-[0.68rem] font-semibold uppercase tracking-[0.26em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow"
                  >
                    {item.label}
                    {/* Hover rule + active indicator (yellow on navy, navy on light). */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100",
                        onLight ? "bg-brand-navy" : "bg-brand-white",
                      )}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -bottom-2 left-1/2 size-1.5 -translate-x-1/2 rounded-full transition-[opacity,scale] duration-500",
                        onLight ? "bg-brand-navy" : "bg-brand-yellow",
                        current ? "scale-100 opacity-100" : "scale-0 opacity-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
            className="-mr-2 flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand-yellow md:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden className="relative block h-3 w-6">
              <span
                className={cn(
                  "absolute left-0 top-0 h-px w-6 bg-current transition-transform duration-300",
                  open && "translate-y-1.5 rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-px bg-current transition-[transform,width] duration-300",
                  open ? "w-6 -translate-y-1.5 -rotate-45" : "w-4",
                )}
              />
            </span>
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      <div
        id={menuId}
        hidden={!open}
        className="fixed inset-0 z-40 flex flex-col bg-brand-navy px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-28 text-brand-white sm:px-8 md:hidden"
      >
        <nav aria-label="Mobile">
          <ul className="grid gap-2">
            {navigation.map((item, index) => {
              const current = isCurrent(item.href);
              return (
                <li key={item.href} className="border-b border-brand-white/10">
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-5 py-5 focus-visible:outline-2 focus-visible:outline-brand-yellow"
                  >
                    <span className="font-mono text-[0.68rem] tabular-nums text-brand-soft-blue">
                      {formatStep(index + 1)}
                    </span>
                    <span
                      className={cn(
                        "text-[2.4rem] font-semibold uppercase leading-none tracking-[-0.03em]",
                        current && "text-brand-yellow",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="mt-auto flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-brand-soft-blue">
          <Sparkle className="size-3" />
          Care that goes beyond clean
        </p>
      </div>
    </>
  );
}
