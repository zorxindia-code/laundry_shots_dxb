import type { ElementName } from "@/config/elements";
import type { ImageAsset } from "@/types/assets";

/**
 * The five stages of the Shots Laundry journey animation.
 */
export type JourneyStageId =
  | "dirty-clothes"
  | "washing-machine"
  | "ironing"
  | "delivery"
  | "fresh-clothes";

/** Brand background colour of a scene. */
export type JourneyTone = "navy" | "yellow";

export interface JourneyStage {
  id: JourneyStageId;
  order: number;
  title: string;
  description: string;
  /** Scene background colour (brand token). */
  tone: JourneyTone;
  /** Transparent foreground PNG shown on the animated stage. */
  element: ElementName;
  /**
   * Full-composition reference image (JPG, background included). Not shown
   * on the animated stage — the PNG element + brand background replace it.
   */
  scene: ImageAsset;
  /** Solid background colour baked into the scene JPG, sampled from the file. */
  sceneBackground: string;
}
