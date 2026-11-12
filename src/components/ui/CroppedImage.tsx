import Image from "next/image";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import type { ImageAsset, PixelBox } from "@/types/assets";

interface CroppedImageProps {
  image: ImageAsset;
  /** Region of the source image to show, in source pixels. */
  box: PixelBox;
  alt?: string;
  /**
   * `sizes` for the underlying (uncropped) image. It renders at
   * `image.width / box.width` × the frame's width, so scale accordingly.
   */
  sizes: string;
  /** Sizing / positioning classes for the frame (its aspect ratio is fixed to the box). */
  className?: string;
  style?: CSSProperties;
  imageClassName?: string;
  preload?: boolean;
}

/**
 * Shows exactly `box` of an image: the frame takes the box's aspect ratio and
 * the full image is scaled and offset inside it, so the crop happens in CSS
 * and the original file stays untouched. Used for the logo (its visible
 * bounds), transparent PNG elements (their measured visible bounds) and
 * editorial close-ups of the journey scenes.
 */
export function CroppedImage({
  image,
  box,
  alt = image.alt,
  sizes,
  className,
  style,
  imageClassName,
  preload,
}: CroppedImageProps) {
  return (
    <span
      className={cn("relative block overflow-hidden", className)}
      style={{ aspectRatio: `${box.width} / ${box.height}`, ...style }}
    >
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt={alt}
        sizes={sizes}
        preload={preload}
        draggable={false}
        className={cn("absolute h-auto max-w-none select-none", imageClassName)}
        style={{
          width: `${(image.width / box.width) * 100}%`,
          left: `${(-box.x / box.width) * 100}%`,
          top: `${(-box.y / box.height) * 100}%`,
        }}
      />
    </span>
  );
}
