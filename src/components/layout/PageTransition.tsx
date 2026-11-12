import type { ReactNode } from "react";

/**
 * Subtle route entrance: the incoming page fades in (opacity only — no
 * transforms, so sticky/fixed positioning and the experience animation's
 * measurements are unaffected). Disabled for reduced motion. Rendered by
 * `app/template.tsx`, which remounts on every navigation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-enter flex flex-1 flex-col">{children}</div>;
}
