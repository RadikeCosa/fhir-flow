import React from "react";

export default function Loading() {
  return (
    <div className="w-full">
      <div className="h-4 w-16 bg-border rounded animate-pulse mb-4" />
      <div className="h-6 w-40 bg-border rounded animate-pulse mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-border rounded-lg animate-pulse" />
        <div className="h-48 bg-border rounded-lg animate-pulse" />
        <div className="h-48 bg-border rounded-lg animate-pulse" />
        <div className="h-48 bg-border rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
