"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { gsap } from "@/lib/gsap";

/**
 * Scroll-linked reveals for a section (native scrolling, no hijacking).
 * Descendants opt in with data attributes:
 *
 * - `data-reveal`            — fades and rises once as it enters the viewport;
 *   `data-reveal="words"`    — masked words slide up (see `SplitHeading`);
 *   `data-reveal-delay="0.1"`— delay in seconds;
 * - `data-parallax="40"`     — drifts by ±N px while the section crosses the
 *   viewport (scrubbed to scroll);
 * - `data-draw="x" | "y"`    — a line that draws in as it scrolls into view.
 *
 * Everything is reverted on unmount (route changes) and skipped entirely when
 * the user prefers reduced motion.
 */
export function ScrollReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const all = <T extends HTMLElement>(selector: string) =>
          Array.from(root.querySelectorAll<T>(selector));

        all("[data-reveal]").forEach((el) => {
          const delay = Number(el.dataset.revealDelay ?? 0);
          const scrollTrigger = { trigger: el, start: "top 88%", once: true };
          if (el.dataset.reveal === "words") {
            gsap.fromTo(
              el.querySelectorAll("[data-word] > span"),
              { yPercent: 115 },
              { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay, scrollTrigger },
            );
          } else {
            gsap.fromTo(
              el,
              { autoAlpha: 0, y: 36 },
              { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", delay, scrollTrigger },
            );
          }
        });

        all("[data-parallax]").forEach((el) => {
          const distance = Number(el.dataset.parallax) || 40;
          gsap.fromTo(
            el,
            { y: distance },
            {
              y: -distance,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        all("[data-draw]").forEach((el) => {
          const axis = el.dataset.draw === "y" ? "scaleY" : "scaleX";
          gsap.fromTo(
            el,
            { [axis]: 0 },
            {
              [axis]: 1,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 90%", end: "bottom 55%", scrub: true },
            },
          );
        });
      },
      root,
    );

    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
