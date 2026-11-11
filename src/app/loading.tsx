export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}
