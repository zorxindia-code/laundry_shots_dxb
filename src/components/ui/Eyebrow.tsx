import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Small uppercase section label with a short yellow rule, e.g. "02 — The Shots Difference". */
export function Eyebrow({
  index,
  children,
  className,
  rule = "yellow",
}: {
  index?: string;
  children: ReactNode;
  className?: string;
  /** Rule colour: yellow on navy, navy on yellow/white. */
  rule?: "yellow" | "navy";
}) {
  return (
    <p className={cn("flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.3em]", className)}>
      {index && <span className="font-mono tabular-nums opacity-60">{index}</span>}
      <span aria-hidden className={cn("h-px w-8", rule === "yellow" ? "bg-brand-yellow" : "bg-brand-navy")} />
      {children}
    </p>
  );
}
