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
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-brand-navy px-4 py-2 text-brand-white"
      >
        Try again
      </button>
    </main>
  );
}
