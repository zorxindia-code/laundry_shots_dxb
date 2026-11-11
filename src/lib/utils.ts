/**
 * Join conditional class names, skipping falsy values.
 *
 * @example cn("px-4", isActive && "text-brand-yellow")
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a 1-based step number as two digits, e.g. 1 → "01". */
export function formatStep(step: number): string {
  return String(step).padStart(2, "0");
}
