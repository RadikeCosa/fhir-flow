import React from "react";

// Server Component used as Suspense fallback for patients route
export default function Loading() {
  // create an array of 6 items for skeleton cards
  const skeletons = Array.from({ length: 6 });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-border rounded animate-pulse" />
        <div className="h-5 w-20 bg-border rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-lg p-4 md:p-5"
          >
            <div className="h-5 w-3/4 bg-border rounded animate-pulse mb-3" />
            <div className="h-4 w-1/2 bg-border rounded animate-pulse mb-2" />
            <div className="h-4 w-2/5 bg-border rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
