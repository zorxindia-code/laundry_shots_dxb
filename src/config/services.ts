import type { ElementName } from "@/config/elements";
import type { SceneCropName } from "@/config/sceneCrops";

/**
 * Service categories shown in the homepage preview and the enquiry form.
 *
 * ⚠️ Subject to confirmation against the actual service list before launch.
 * Copy is descriptive only — no claims about certifications, timings or
 * pricing.
 */
export type ServiceVisual =
  | { kind: "element"; name: ElementName }
  | { kind: "crop"; name: SceneCropName };

export interface Service {
  id: string;
  title: string;
  summary: string;
  visual: ServiceVisual;
}

export const services: readonly Service[] = [
  {
    id: "washing",
    title: "Washing & Cleaning",
    summary:
      "Thorough, careful washing for your everyday essentials — sorted, cleaned and treated with respect for every fabric.",
    visual: { kind: "element", name: "washingMachine" },
  },
  {
    id: "deep-cleaning",
    title: "Deep Cleaning",
    summary:
      "Extra attention for the garments that need more than an everyday wash, from worn-in marks to heavy use.",
    visual: { kind: "element", name: "stainedShirt" },
  },
  {
    id: "ironing",
    title: "Precision Ironing",
    summary:
      "Crisp collars, clean lines and carefully pressed finishes — garment by garment.",
    visual: { kind: "element", name: "ironingBoard" },
  },
  {
    id: "pickup-delivery",
    title: "Pickup & Delivery",
    summary:
      "Collected from your door and returned fresh, so clean laundry fits around your day.",
    visual: { kind: "element", name: "vanRearView" },
  },
  {
    id: "garment-care",
    title: "Garment Care",
    summary:
      "Considered handling for the pieces you care about most, finished and ready to wear.",
    visual: { kind: "crop", name: "freshCollar" },
  },
];
