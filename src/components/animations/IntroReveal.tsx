"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { gsap } from "@/lib/gsap";

/**
 * Entrance sequence for a hero. Children mark themselves with
 * `data-intro="<kind>"` and an optional start time `data-intro-at` (seconds):
 *
 * - `words`  — masked words slide up (see `SplitHeading`);
 * - `fade`   — fades and rises slightly;
 * - `visual` — product visual: rises, fades in and settles from a slight scale.
 *
 * Items start hidden via CSS (`html[data-js] [data-intro]`, see globals.css) so
 * nothing flashes before hydration; a CSS fallback reveals them if this never
 * runs. Reduced motion: shown immediately, no movement.
 */
export function IntroReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        reduceMotion: "(prefers-reduced-motion: reduce)",
        fullMotion: "(prefers-reduced-motion: no-preference)",
      },
      (context) => {
        const items = Array.from(root.querySelectorAll<HTMLElement>("[data-intro]"));
        if (context.conditions?.reduceMotion) {
          gsap.set(items, { opacity: 1 });
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        items.forEach((el) => {
          const at = Number(el.dataset.introAt ?? 0);
          switch (el.dataset.intro) {
            case "words": {
              tl.set(el, { opacity: 1 }, 0);
              const words = el.querySelectorAll("[data-word] > span");
              tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.07 }, at);
              break;
            }
            case "visual":
              tl.fromTo(
                el,
                { opacity: 0, y: 70, scale: 1.05 },
                { opacity: 1, y: 0, scale: 1, duration: 1.7, ease: "power3.out" },
                at,
              );
              break;
            default:
              tl.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9 }, at);
          }
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
