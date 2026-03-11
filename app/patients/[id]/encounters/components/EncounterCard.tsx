"use client";

import { useState } from "react";
import { SectionCard } from "../../../components/detail/SectionCard";
import { formatDate } from "../../../../../lib/patient/formatters";
import type {
  Encounter,
  EncounterVisitType,
} from "../../../../../domain/encounters/encounter";

interface Props {
  encounter: Encounter;
}

interface BadgeInfo {
  label: string;
  colorClass: string;
}

function getVisitTypeBadge(visitType: EncounterVisitType): BadgeInfo {
  switch (visitType) {
    case "initial":
      return { label: "Inicial", colorClass: "bg-blue-100 text-blue-800" };
    case "follow-up":
      return {
        label: "Seguimiento",
        colorClass: "bg-yellow-100 text-yellow-800",
      };
    case "discharge":
      return { label: "Alta", colorClass: "bg-green-100 text-green-800" };
    default:
      return { label: visitType, colorClass: "bg-gray-100 text-gray-800" };
  }
}

export default function EncounterCard({ encounter }: Props) {
  const [expanded, setExpanded] = useState(false);

  const visitBadge = getVisitTypeBadge(encounter.visitType);

  return (
    <SectionCard title="Encuentro">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-foreground">
          {formatDate(encounter.periodStart) ?? ""}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            visitBadge.colorClass
          }`}
        >
          {visitBadge.label}
        </span>
      </div>
      <p className="text-xs text-muted mb-2">
        {encounter.reasonDisplay || "Sin motivo registrado"}
      </p>

      {encounter.clinicalNote && (
        <div className="text-sm text-foreground">
          <div className={!expanded ? "line-clamp-3 overflow-hidden" : ""}>
            {encounter.clinicalNote}
          </div>
          <button
            type="button"
            className="mt-1 text-xs text-primary hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        </div>
      )}
    </SectionCard>
  );
}
