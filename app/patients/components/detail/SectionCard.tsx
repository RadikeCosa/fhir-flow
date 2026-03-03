import React from "react";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Reusable card wrapper for patient detail sections.
 *
 * Centralises the visual shell (surface background, border, shadow, padding,
 * rounded corners) so individual sections only define their own content.
 */
export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="p-4 bg-surface border border-border rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </section>
  );
}
