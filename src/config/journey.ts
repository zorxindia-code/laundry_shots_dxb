import type { JourneyStage } from "@/types/journey";

/**
 * The five laundry journey scenes, in sequence.
 *
 * - `element`: the transparent PNG foreground shown on the animated stage
 *   (see `@/config/elements`).
 * - `scene`: the original full-composition JPG (8000×4500, background
 *   included) in `public/images/laundry-journey/`. Kept as the composition
 *   reference; it is not layered under the PNG, which would duplicate the
 *   product. Original filenames: "shots laundry website images-0N.jpg".
 */
const SCENE_DIR = "/images/laundry-journey";
const SCENE_WIDTH = 8000;
const SCENE_HEIGHT = 4500;

/** Background colours sampled from the scene JPGs. */
const SCENE_NAVY = "#01135F";
const SCENE_YELLOW = "#FEF00B";

export const journeyStages: readonly JourneyStage[] = [
  {
    id: "dirty-clothes",
    order: 1,
    title: "Dirty Clothes",
    description: "Every great transformation starts somewhere.",
    tone: "navy",
    element: "stainedShirt",
    scene: {
      src: `${SCENE_DIR}/shots-laundry-website-images-01.jpg`,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      alt: "A stained cream button-down shirt on a navy background",
    },
    sceneBackground: SCENE_NAVY,
  },
  {
    id: "washing-machine",
    order: 2,
    title: "Deep Cleaning",
    description: "Advanced cleaning care for your everyday essentials.",
    tone: "yellow",
    element: "washingMachine",
    scene: {
      src: `${SCENE_DIR}/shots-laundry-website-images-02.jpg`,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      alt: "A blue washing machine with a soapy shirt load on a yellow background",
    },
    sceneBackground: SCENE_YELLOW,
  },
  {
    id: "ironing",
    order: 3,
    title: "Precision Ironing",
    description: "Carefully finished. Perfectly pressed.",
    tone: "navy",
    element: "ironingBoard",
    scene: {
      src: `${SCENE_DIR}/shots-laundry-website-images-03.jpg`,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      alt: "A white shirt and iron on an ironing board on a navy background",
    },
    sceneBackground: SCENE_NAVY,
  },
  {
    id: "delivery",
    order: 4,
    title: "On the Way",
    description: "Your freshly cleaned clothes, delivered to your door.",
    tone: "yellow",
    element: "vanTopDown",
    scene: {
      src: `${SCENE_DIR}/shots-laundry-website-images-04.jpg`,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      alt: "A top-down view of a yellow and navy delivery van on a yellow background",
    },
    sceneBackground: SCENE_YELLOW,
  },
  {
    id: "fresh-clothes",
    order: 5,
    title: "Fresh & Ready",
    description: "Clean, crisp and ready to wear.",
    tone: "navy",
    element: "shirtOnHanger",
    scene: {
      src: `${SCENE_DIR}/shots-laundry-website-images-05.jpg`,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      alt: "A clean white shirt on a wooden hanger on a navy background",
    },
    sceneBackground: SCENE_NAVY,
  },
];
