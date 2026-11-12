import { journeyStages } from "@/config/journey";
import type { ImageAsset, PixelBox } from "@/types/assets";

/**
 * Editorial close-ups cropped from the original 8000×4500 journey scene JPGs.
 *
 * The crop happens in CSS (`SceneCrop`), so the original files are untouched.
 * `box` is in source pixels; its aspect ratio is the frame's aspect ratio.
 */
export interface SceneCrop {
  image: ImageAsset;
  box: PixelBox;
  alt: string;
}

const scene = (order: number) => {
  const stage = journeyStages.find((s) => s.order === order);
  if (!stage) throw new Error(`Unknown journey scene ${order}`);
  return stage.scene;
};

export const sceneCrops = {
  /** Scene 01: stained cream fabric, collar, placket and pocket. */
  stainedFabric: {
    image: scene(1),
    box: { x: 3280, y: 2650, width: 1440, height: 1800 },
    alt: "Close-up of a stained cream shirt before cleaning",
  },
  /** Scene 05: the same framing on a crisp, clean white shirt. */
  freshFabric: {
    image: scene(5),
    box: { x: 3220, y: 2550, width: 1560, height: 1950 },
    alt: "Close-up of a crisp, clean white shirt after care",
  },
  /** Scene 05: wooden hanger and pressed collar. */
  freshCollar: {
    image: scene(5),
    box: { x: 3250, y: 2000, width: 1500, height: 1875 },
    alt: "A freshly pressed white shirt collar on a wooden hanger",
  },
} as const satisfies Record<string, SceneCrop>;

export type SceneCropName = keyof typeof sceneCrops;
