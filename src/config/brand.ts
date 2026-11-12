/**
 * Shots Laundry brand tokens.
 *
 * Single source of truth for brand values used in JavaScript (e.g. GSAP
 * tweens, canvas, meta theme colour). The same colours are exposed to
 * Tailwind in `src/styles/theme.css` — update both together.
 *
 * Colour balance across the site: ~65% midnight navy, ~20% white, ~15% yellow
 * (CTAs, highlights, active states and selected sections only).
 */
export const brandColors = {
  midnightNavy: "#06175E",
  brightYellow: "#FFF000",
  white: "#FFFFFF",
  lightBlue: "#EAF5FC",
  /** Secondary soft blue: muted copy and quiet details on navy. */
  softBlue: "#A8B8E0",
} as const;

export type BrandColor = keyof typeof brandColors;

/**
 * Shots Laundry logo (white wordmark + mark, yellow sparkles) on a large
 * transparent 4500×4500 canvas. `visible` is the measured bounding box of its
 * pixels (alpha ≥ 16); the UI crops to it in CSS — the file is untouched.
 * Original filename: "shotslaundry logo-01.png".
 */
export const brandLogo = {
  src: "/images/brand/shotslaundry%20logo-01.png",
  width: 4500,
  height: 4500,
  alt: "Shots Laundry",
  visible: { x: 1192, y: 1843, width: 2100, height: 814 },
} as const;
