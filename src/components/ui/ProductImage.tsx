import type { CSSProperties } from "react";

import { CroppedImage } from "@/components/ui/CroppedImage";
import { elements, type ElementName } from "@/config/elements";
import { sceneCrops, type SceneCropName } from "@/config/sceneCrops";

interface ProductImageProps {
  /** `sizes` for the underlying image (see `CroppedImage`). */
  sizes: string;
  className?: string;
  style?: CSSProperties;
  imageClassName?: string;
  preload?: boolean;
  alt?: string;
}

/**
 * A transparent PNG element framed to its measured visible bounds, so the
 * frame's size is the product's visible size (no transparent padding).
 */
export function ElementImage({ name, ...props }: ProductImageProps & { name: ElementName }) {
  const element = elements[name];
  return <CroppedImage image={element} box={element.visible} {...props} />;
}

/** An editorial close-up cropped (in CSS) from an original journey scene JPG. */
export function SceneCropImage({ name, ...props }: ProductImageProps & { name: SceneCropName }) {
  const crop = sceneCrops[name];
  return <CroppedImage image={crop.image} box={crop.box} alt={crop.alt} {...props} />;
}
