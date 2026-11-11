/**
 * Shots Laundry brand tokens.
 *
 * Single source of truth for brand values used in JavaScript (e.g. GSAP
 * tweens, canvas, meta theme colour). The same colours are exposed to
 * Tailwind in `src/styles/theme.css` — update both together.
 */
export const brandColors = {
  midnightNavy: "#06175E",
  brightYellow: "#FFF000",
  white: "#FFFFFF",
  lightBlue: "#EAF5FC",
} as const;

export type BrandColor = keyof typeof brandColors;
