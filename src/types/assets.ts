/**
 * A static image in `public/`, with its intrinsic pixel dimensions.
 */
export interface ImageAsset {
  /** Public URL path, e.g. "/images/elements/foo.png". */
  src: string;
  width: number;
  height: number;
  alt: string;
}

/** A pixel rectangle within an image. */
export interface PixelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A transparent PNG element. `visible` is the bounding box of its actual
 * product pixels (alpha ≥ 16), excluding transparent padding and faint haze,
 * so elements can be normalised to the same visible width.
 */
export interface ElementAsset extends ImageAsset {
  visible: PixelBox;
}
