import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Central GSAP entry point. Import `gsap` and `ScrollTrigger` from here
 * (not directly from "gsap") so plugins are registered exactly once.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
