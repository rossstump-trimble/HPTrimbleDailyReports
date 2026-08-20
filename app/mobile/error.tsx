"use client";

import { useEffect } from "react";

export default function MobileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Mobile route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-white text-center">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-600 mb-1 font-mono break-all">{error.message}</p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-4">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded"
      >
        Try again
      </button>
    </div>
  );
}
