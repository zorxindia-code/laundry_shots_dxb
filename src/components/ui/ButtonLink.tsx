import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "navy" | "outline-light" | "outline-dark" | "text-light";

const variants: Record<ButtonVariant, string> = {
  /** Yellow CTA — the main accent use of brand yellow. */
  primary: "px-7 bg-brand-yellow text-brand-navy hover:bg-brand-white focus-visible:outline-brand-yellow",
  /** Navy CTA for yellow / white backgrounds. */
  navy: "px-7 bg-brand-navy text-brand-white hover:bg-brand-navy/90 focus-visible:outline-brand-navy",
  "outline-light": "px-7 border border-brand-white/30 text-brand-white hover:border-brand-yellow hover:text-brand-yellow focus-visible:outline-brand-yellow",
  "outline-dark": "px-7 border border-brand-navy/30 text-brand-navy hover:border-brand-navy hover:bg-brand-navy hover:text-brand-white focus-visible:outline-brand-navy",
  "text-light": "text-brand-white hover:text-brand-yellow focus-visible:outline-brand-yellow",
};

export const buttonClasses = (variant: ButtonVariant = "primary", className?: string) =>
  cn(
    "group inline-flex min-h-12 items-center justify-center gap-3 rounded-full text-[0.72rem] font-semibold uppercase tracking-[0.22em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4",
    variants[variant],
    className,
  );

/** Arrow that nudges right on hover (inside a `group`). */
export function ButtonArrow({ className }: { className?: string }) {
  return (
    <ArrowRight
      aria-hidden
      strokeWidth={1.75}
      className={cn("size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none", className)}
    />
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

/** Internal CTA link styled as a button. */
export function ButtonLink({ variant = "primary", arrow = false, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, className)} {...props}>
      {children}
      {arrow && <ButtonArrow />}
    </Link>
  );
}
