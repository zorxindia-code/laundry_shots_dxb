import { cn } from "@/lib/utils";

/**
 * Four-point sparkle — the yellow accent from the Shots Laundry logo.
 * Decorative; inherits `currentColor` (defaults to brand yellow).
 */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("size-4 text-brand-yellow", className)}
      fill="currentColor"
    >
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
    </svg>
  );
}
