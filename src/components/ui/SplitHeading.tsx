import { createElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SplitHeadingProps {
  as?: "h1" | "h2" | "h3";
  /** One entry per (desktop) line; words still wrap naturally on small screens. */
  lines: readonly ReactNode[];
  className?: string;
  /** Extra classes per line, e.g. a colour for the second line. */
  lineClassNames?: readonly (string | undefined)[];
  id?: string;
  /** Animation hook read by IntroReveal / ScrollReveal ("words"). */
  motion?: "intro" | "reveal";
  /** Intro start time in seconds (IntroReveal). */
  at?: number;
}

/**
 * Editorial headline split into masked words, so `IntroReveal` /
 * `ScrollReveal` can slide each word up from behind its mask. Without
 * JavaScript (or with reduced motion) it is a plain heading.
 */
export function SplitHeading({ as = "h2", lines, className, lineClassNames, id, motion, at }: SplitHeadingProps) {
  const motionProps =
    motion === "intro"
      ? { "data-intro": "words", "data-intro-at": at }
      : motion === "reveal"
        ? { "data-reveal": "words" }
        : {};

  return createElement(
    as,
    { id, className, ...motionProps },
    lines.map((line, i) => (
      <span key={i} className={cn("block", lineClassNames?.[i])}>
        {typeof line === "string"
          ? line.split(" ").map((word, w, words) => (
              <span key={w}>
                <span data-word className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                  <span className="inline-block will-change-transform">{word}</span>
                </span>
                {w < words.length - 1 && " "}
              </span>
            ))
          : line}
      </span>
    )),
  );
}
