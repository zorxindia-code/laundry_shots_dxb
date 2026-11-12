"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      data-nav-tone="navy"
      className="flex min-h-svh flex-1 flex-col items-center justify-center gap-8 bg-brand-navy px-5 text-center text-brand-white"
    >
      <h1 className="text-[clamp(2rem,6vw,4rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em]">
        Something went wrong
      </h1>
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-12 rounded-full bg-brand-yellow px-7 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-brand-navy transition-colors hover:bg-brand-white"
      >
        Try again
      </button>
    </main>
  );
}
