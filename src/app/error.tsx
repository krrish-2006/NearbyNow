"use client";

import { useEffect } from "react";

import Button from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        message: "App route error boundary",
        error: error.message,
        digest: error.digest,
      }),
    );
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6">
      <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-black">Something went wrong</h1>

        <p className="mt-3 text-neutral-600">
          Please try again. The error has been logged for debugging.
        </p>

        <Button onClick={reset} className="mt-6 h-11 rounded-xl px-5">
          Try again
        </Button>
      </div>
    </main>
  );
}
