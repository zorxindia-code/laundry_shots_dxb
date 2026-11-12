"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * A visual that floats gently (CSS) and leans toward the pointer (GSAP
 * quickTo — only reacts to pointer movement, no timers). Disabled for
 * reduced motion and on devices without a fine pointer.
 */
export function FloatingVisual({
  children,
  className,
  strength = 18,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum pointer offset in px. */
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
      const x = gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" });
      const r = gsap.quickTo(el, "rotation", { duration: 1.4, ease: "power3.out" });

      const onMove = (event: PointerEvent) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        x(nx * strength * 2);
        y(ny * strength);
        r(nx * 3);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    });

    return () => mm.revert();
  }, [strength]);

  return (
    <div className={cn("motion-safe:animate-[float_7s_ease-in-out_infinite]", className)}>
      <div ref={ref} className="will-change-transform">
        {children}
      </div>
    </div>
  );
}
