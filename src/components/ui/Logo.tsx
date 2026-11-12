import type { CSSProperties } from "react";

import { CroppedImage } from "@/components/ui/CroppedImage";
import { brandLogo } from "@/config/brand";
import { cn } from "@/lib/utils";

export type LogoTone = "light" | "dark";

const { visible } = brandLogo;

/**
 * Monochrome navy version for light backgrounds: the original PNG used as a
 * CSS mask (cropped to its visible bounds), so no recoloured file is needed.
 */
const darkMaskStyle: CSSProperties = {
  aspectRatio: `${visible.width} / ${visible.height}`,
  maskImage: `url("${brandLogo.src}")`,
  maskRepeat: "no-repeat",
  maskSize: `${(brandLogo.width / visible.width) * 100}% auto`,
  maskPosition: `${(visible.x / (brandLogo.width - visible.width)) * 100}% ${(visible.y / (brandLogo.height - visible.height)) * 100}%`,
};

/**
 * Shots Laundry logo, cropped to its visible bounds. `light` is the original
 * artwork (white with yellow sparkles) for navy backgrounds; `dark` is a navy
 * silhouette for yellow / white backgrounds. Size it with a height class.
 */
export function Logo({
  tone = "light",
  className,
  preload,
}: {
  tone?: LogoTone;
  className?: string;
  preload?: boolean;
}) {
  if (tone === "dark") {
    return <span aria-hidden className={cn("block bg-brand-navy", className)} style={darkMaskStyle} />;
  }
  return (
    <CroppedImage
      image={brandLogo}
      box={visible}
      alt=""
      sizes="(min-width: 1024px) 240px, 200px"
      preload={preload}
      className={className}
    />
  );
}

/**
 * Logo that cross-fades between its light and dark versions (e.g. the navbar
 * over navy vs. yellow sections). Decorative: label the surrounding link.
 */
export function AdaptiveLogo({ tone, className }: { tone: LogoTone; className?: string }) {
  return (
    <span className={cn("relative block", className)} style={{ aspectRatio: `${visible.width} / ${visible.height}` }}>
      <span className={cn("absolute inset-0 transition-opacity duration-500", tone !== "light" && "opacity-0")}>
        <Logo tone="light" preload className="h-full" />
      </span>
      <span className={cn("absolute inset-0 transition-opacity duration-500", tone !== "dark" && "opacity-0")}>
        <Logo tone="dark" className="h-full" />
      </span>
    </span>
  );
}
