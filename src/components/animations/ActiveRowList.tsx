"use client";

import { type ReactNode, useEffect, useRef } from "react";

/** Activation line: a thin band around the vertical centre of the viewport. */
const CENTRE_BAND = "-49% 0px -50% 0px";

/**
 * List of interactive rows (`<li data-active-row class="group">`) that gives
 * touch devices the same active look desktop users get on hover.
 *
 * On devices without hover, the row crossing the centre of the viewport gets
 * `data-active` (styled through the `row-active:` variant, the same classes as
 * hover). Exactly one row is active at a time: the current one keeps the state
 * until it leaves the centre band, so boundaries never flicker. Tapping a row
 * activates it immediately; scrolling then takes over again.
 *
 * One IntersectionObserver, no scroll listeners, no React state; everything is
 * disconnected on unmount (or when the page is hidden by navigation).
 */
export function ActiveRowList({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const touch = window.matchMedia("(hover: none)");
    let observer: IntersectionObserver | null = null;
    let active: HTMLElement | null = null;
    const inBand = new Set<HTMLElement>();

    const activate = (row: HTMLElement | null) => {
      if (row === active) return;
      active?.removeAttribute("data-active");
      active = row;
      active?.setAttribute("data-active", "");
    };

    const onTap = (event: Event) => {
      const row = (event.target as HTMLElement).closest<HTMLElement>("[data-active-row]");
      if (row && list.contains(row)) activate(row);
    };

    const start = () => {
      const rows = Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-active-row]"));
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const row = entry.target as HTMLElement;
            if (entry.isIntersecting) inBand.add(row);
            else inBand.delete(row);
          }
          // Keep the current row while it is still on the centre line;
          // otherwise the row now crossing it (none: outside the list).
          if (active && inBand.has(active)) return;
          activate(inBand.values().next().value ?? null);
        },
        { rootMargin: CENTRE_BAND },
      );
      rows.forEach((row) => observer!.observe(row));
      list.addEventListener("click", onTap);
    };

    const stop = () => {
      observer?.disconnect();
      observer = null;
      inBand.clear();
      list.removeEventListener("click", onTap);
      activate(null);
    };

    const sync = () => {
      stop();
      if (touch.matches) start();
    };
    sync();
    touch.addEventListener("change", sync);
    return () => {
      touch.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}
