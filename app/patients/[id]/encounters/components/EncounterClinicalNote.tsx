"use client";

import { useState } from "react";

interface Props {
  note: string;
  collapsible?: boolean;
  plannedStyle?: boolean;
}

export default function EncounterClinicalNote({
  note,
  collapsible = false,
  plannedStyle = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const containerClass = plannedStyle
    ? "bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-foreground"
    : "bg-surface border border-border rounded-md p-3 text-sm text-foreground";

  return (
    <div>
      {plannedStyle ? (
        <p className="text-xs text-blue-700 font-semibold">
          Nota del kinesiólogo
        </p>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
          Nota clínica
        </p>
      )}

      <div className={containerClass}>
        <div
          className={
            !expanded && collapsible ? "line-clamp-3 overflow-hidden" : ""
          }
        >
          {note}
        </div>

        {collapsible && (
          <button
            type="button"
            className="mt-1 text-xs text-primary hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>
    </div>
  );
}
