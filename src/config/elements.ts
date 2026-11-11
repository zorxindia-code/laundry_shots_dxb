import type { ElementAsset } from "@/types/assets";

/**
 * Individual transparent PNG elements in `public/images/elements/`.
 *
 * Optional layered/foreground or decorative objects. They are NOT the main
 * scroll scenes — those live in `@/config/journey`.
 *
 * Filenames are the originals in kebab-case; file contents unchanged.
 * `visible` boxes were measured from each PNG's alpha channel (alpha ≥ 16).
 */
const ELEMENT_DIR = "/images/elements";

export const elements = {
  /** Original: "Stained Cream Button-Down Shirt.png" */
  stainedShirt: {
    src: `${ELEMENT_DIR}/stained-cream-button-down-shirt.png`,
    width: 1089,
    height: 1445,
    alt: "Stained cream button-down shirt",
    visible: { x: 1, y: 20, width: 1087, height: 1411 },
  },
  /** Original: "Blue Washing Machine with Soapy Shirt Load.png" */
  washingMachine: {
    src: `${ELEMENT_DIR}/blue-washing-machine-with-soapy-shirt-load.png`,
    width: 1116,
    height: 1409,
    alt: "Blue washing machine with a soapy shirt load",
    visible: { x: 137, y: 166, width: 843, height: 1139 },
  },
  /** Original: "Shirt and Iron on Ironing Board.png" */
  ironingBoard: {
    src: `${ELEMENT_DIR}/shirt-and-iron-on-ironing-board.png`,
    width: 1025,
    height: 1534,
    alt: "White shirt and iron on an ironing board",
    visible: { x: 30, y: 6, width: 954, height: 1517 },
  },
  /** Original: "Top-Down Yellow and Navy Van.png" */
  vanTopDown: {
    src: `${ELEMENT_DIR}/top-down-yellow-and-navy-van.png`,
    width: 793,
    height: 1983,
    alt: "Top-down view of a yellow and navy delivery van",
    visible: { x: 3, y: 108, width: 786, height: 1703 },
  },
  /** Original: "Rear View Yellow Navy Delivery Van.png" */
  vanRearView: {
    src: `${ELEMENT_DIR}/rear-view-yellow-navy-delivery-van.png`,
    width: 1312,
    height: 1199,
    alt: "Rear view of a yellow and navy delivery van",
    visible: { x: 117, y: 49, width: 1073, height: 1124 },
  },
  /** Original: "White Button-Up Shirt on Wooden Hanger.png" */
  shirtOnHanger: {
    src: `${ELEMENT_DIR}/white-button-up-shirt-on-wooden-hanger.png`,
    width: 1086,
    height: 1448,
    alt: "Clean white button-up shirt on a wooden hanger",
    visible: { x: 13, y: 11, width: 1057, height: 1426 },
  },
} as const satisfies Record<string, ElementAsset>;

export type ElementName = keyof typeof elements;
