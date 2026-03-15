"use client";

import { useState } from "react";
import { SectionCard } from "../../../components/detail/SectionCard";
import { formatDateTime } from "../../../../../lib/patient/formatters";
import { formatEncounterVisitType } from "../../../../../lib/patient/formatters/encounter.formatters";
import { getEncounterStatusBadge } from "../../../../../lib/patient/formatters/encounter.formatters";
import {
  formatProcedureCategory,
  groupProceduresByCategory,
} from "../../../../../lib/patient/formatters";
import type {
  Encounter,
  EncounterVisitType,
} from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import type { BarthelAssessment } from "../../../../../domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "../../../../../domain/assessments/necpal-assessment";
import EncounterVitalSignsSection from "./EncounterVitalSignsSection";
import EncounterEvaSection from "./EncounterEvaSection";
import EncounterAssessmentsSection from "./EncounterAssessmentsSection";

interface Props {
  encounter: Encounter;
  procedures: Procedure[];
  vitalSigns: VitalSignRecord[];
  evaRecords: EvaAssessment[];
  barthelAssessment: BarthelAssessment | null;
  necpalAssessment: NecpalAssessment | null;
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

export default function EncounterCard({
  encounter,
  procedures,
  vitalSigns,
  evaRecords,
  barthelAssessment,
  necpalAssessment,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);

  const isPlanned = encounter.status === "planned";
  const visitBadge = getVisitTypeBadge(encounter.visitType);
  const statusBadge = getEncounterStatusBadge(encounter.status);

  const hasInitialAssessments =
    encounter.visitType === "initial" &&
    (barthelAssessment !== null || necpalAssessment !== null);

  // planned encounters should not be expandable regardless of details
  const hasDetails =
    !isPlanned &&
    (!!encounter.clinicalNote ||
      procedures.length > 0 ||
      hasInitialAssessments);

  const formattedDate = formatDateTime(encounter.periodStart) ?? "";
  const visitLabel = formatEncounterVisitType(encounter.visitType);
  const title = `${visitLabel} — ${formattedDate}`;

  const groupedProcedures = groupProceduresByCategory(procedures);

  return (
    <div className={isPlanned ? "border-l-4 border-blue-400" : ""}>
      <SectionCard title={title}>
        {/* Compact summary row */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted truncate min-w-0 flex-1">
            {encounter.reasonDisplay || "Sin motivo registrado"}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {isPlanned && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.colorClass}`}
              >
                {statusBadge.label}
              </span>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${visitBadge.colorClass}`}
            >
              {visitBadge.label}
            </span>
            {hasDetails && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Ocultar detalles ▲" : "Ver detalles ▼"}
              </button>
            )}
          </div>
        </div>

        {/* Planned session note block */}
        {isPlanned && (
          <div className="mb-2">
            <p className="text-xs text-blue-700 font-semibold">
              Nota del kinesiólogo
            </p>
            {encounter.clinicalNote ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-foreground">
                {encounter.clinicalNote}
              </div>
            ) : (
              <p className="text-xs text-muted italic">
                Sin nota de preparación
              </p>
            )}
          </div>
        )}

        {/* Expandable detail section */}
        {expanded && (
          <div className="space-y-4 pt-1 border-t border-border">
            {/* Assessments — only shown for initial encounters */}
            {encounter.visitType === "initial" && (
              <EncounterAssessmentsSection
                barthelAssessment={barthelAssessment}
                necpalAssessment={necpalAssessment}
              />
            )}

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
                            <li
                              key={proc.id}
                              className="text-xs text-foreground"
                            >
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

            {/* Vital signs section */}
            <EncounterVitalSignsSection records={vitalSigns} />

            {/* EVA assessments section */}
            <EncounterEvaSection records={evaRecords} />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
