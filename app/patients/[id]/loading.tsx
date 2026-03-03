import React from "react";

export default function Loading() {
  const sections = Array.from({ length: 4 });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-border rounded animate-pulse" />
        <div className="h-5 w-20 bg-border rounded-full animate-pulse" />
      </div>

      <div className="space-y-4">
        {sections.map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-lg p-4 md:p-5"
          >
            <div className="h-6 w-40 bg-border rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-border rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-border rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-border rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-border rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
