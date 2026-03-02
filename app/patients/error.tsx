"use client";
import React from "react";

/**
 * Error boundary for the patients route (Client Component).
 *
 * Responsibilities:
 * - Show a friendly error message when a server error bubbles here.
 * - Provide a retry button that calls the `reset` callback provided by Next.js.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-4">
          {error?.message ?? "An unexpected error occurred."}
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
