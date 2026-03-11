"use client";

import { useState } from "react";
import { SectionCard } from "../../../components/detail/SectionCard";
import { formatDateTime } from "../../../../../lib/patient/formatters";
import {
  formatProcedureCategory,
  groupProceduresByCategory,
} from "../../../../../lib/patient/formatters";
import type {
  Encounter,
  EncounterVisitType,
} from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";

interface Props {
  encounter: Encounter;
  procedures: Procedure[];
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

export default function EncounterCard({ encounter, procedures }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);

  const visitBadge = getVisitTypeBadge(encounter.visitType);
  const hasDetails = !!encounter.clinicalNote || procedures.length > 0;

  const groupedProcedures = groupProceduresByCategory(procedures);

  return (
    <SectionCard title="Encuentro">
      {/* Header row: datetime + badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-foreground">
          {formatDateTime(encounter.periodStart) ?? ""}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${visitBadge.colorClass}`}
        >
          {visitBadge.label}
        </span>
      </div>

      {/* Reason */}
      <p className="text-xs text-muted mb-2">
        {encounter.reasonDisplay || "Sin motivo registrado"}
      </p>

      {/* Expand / collapse toggle */}
      {hasDetails && (
        <button
          type="button"
          className="text-xs text-primary hover:underline mb-3"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Ocultar detalles ▲" : "Ver detalles ▼"}
        </button>
      )}

      {/* Expandable detail section */}
      {expanded && (
        <div className="space-y-4 pt-1 border-t border-border">
          {/* Clinical note */}
          {encounter.clinicalNote && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                Nota clínica
              </p>
              <div className="text-sm text-foreground">
                <div
                  className={
                    !noteExpanded ? "line-clamp-3 overflow-hidden" : ""
                  }
                >
                  {encounter.clinicalNote}
                </div>
                <button
                  type="button"
                  className="mt-1 text-xs text-primary hover:underline"
                  onClick={() => setNoteExpanded((v) => !v)}
                >
                  {noteExpanded ? "Ver menos" : "Ver más"}
                </button>
              </div>
            </div>
          )}

          {/* Procedures */}
          {procedures.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                Procedimientos
              </p>

              {/* Category chips with count */}
              <div className="flex flex-wrap gap-2 mb-3">
                {Array.from(groupedProcedures.entries()).map(
                  ([category, procs]) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {formatProcedureCategory(category)}
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold">
                        {procs.length}
                      </span>
                    </span>
                  ),
                )}
              </div>

              {/* Detailed list grouped by category */}
              <div className="space-y-3">
                {Array.from(groupedProcedures.entries()).map(
                  ([category, procs]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-foreground mb-1">
                        {formatProcedureCategory(category)}
                      </p>
                      <ul className="space-y-1">
                        {procs.map((proc) => (
                          <li key={proc.id} className="text-xs text-foreground">
                            <span className="font-medium">
                              • {proc.display}
                            </span>
                            {proc.bodySite && (
                              <span className="text-muted ml-1">
                                — {proc.bodySite}
                              </span>
                            )}
                            {proc.note && (
                              <p className="text-muted mt-0.5 ml-3">
                                {proc.note}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
