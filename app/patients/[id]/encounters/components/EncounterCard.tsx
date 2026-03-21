"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SectionCard } from "../../../components/SectionCard";
import {
  formatDateTime,
  formatPlannedSchedule,
} from "../../../../../lib/patient/formatters";
import {
  formatEncounterVisitType,
  getEncounterRepresentativeStart,
} from "../../../../../lib/patient/formatters/encounter.formatters";
import type { Encounter } from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import type { BarthelAssessment } from "../../../../../domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "../../../../../domain/assessments/necpal-assessment";
import type { EcogAssessment } from "../../../../../domain/assessments/ecog-assessment";
import EncounterBadgesRow from "./EncounterBadgesRow";
import EncounterClinicalNote from "./EncounterClinicalNote";
import EncounterProcedures from "./EncounterProcedures";
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
  ecogAssessment: EcogAssessment | null;
}

export default function EncounterCard({
  encounter,
  procedures,
  vitalSigns,
  evaRecords,
  barthelAssessment,
  necpalAssessment,
  ecogAssessment,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const isPlanned = encounter.status === "planned";
  const isFinished = encounter.status === "finished";

  const hasAssessments =
    (encounter.visitType === "initial" ||
      encounter.visitType === "re-assessment") &&
    (barthelAssessment !== null ||
      necpalAssessment !== null ||
      ecogAssessment !== null);

  // planned encounters should not be expandable regardless of details
  const hasDetails =
    !isPlanned &&
    (!!encounter.clinicalNote || procedures.length > 0 || hasAssessments);

  const plannedSchedule = formatPlannedSchedule(
    encounter.plannedDate,
    encounter.plannedTime,
  );
  const representativeStart = getEncounterRepresentativeStart(encounter);

  const formattedDate = isPlanned
    ? `${plannedSchedule.plannedDateLabel ?? "Sin fecha planificada"} • ${plannedSchedule.plannedTimeLabel ?? "Sin horario definido"}`
    : (formatDateTime(representativeStart) ?? representativeStart ?? "");
  const visitLabel = formatEncounterVisitType(encounter.visitType);
  const title = `${visitLabel} — ${formattedDate}`;

  return (
    <div className={isPlanned ? "border-l-4 border-blue-400" : ""}>
      <SectionCard title={title}>
        {/* Compact summary row */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted truncate min-w-0 flex-1">
            {encounter.reasonDisplay || "Sin motivo registrado"}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <EncounterBadgesRow
              status={encounter.status}
              visitType={encounter.visitType}
              showStatusBadge={isPlanned}
            />
            {hasDetails && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <>
                    Ocultar detalles
                    <ChevronUp size={14} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Ver detalles
                    <ChevronDown size={14} aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Planned session note block */}
        {isPlanned && (
          <div className="mb-2">
            {encounter.clinicalNote ? (
              <EncounterClinicalNote
                note={encounter.clinicalNote}
                plannedStyle
              />
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
            {(encounter.visitType === "initial" ||
              encounter.visitType === "re-assessment") && (
              <EncounterAssessmentsSection
                barthelAssessment={barthelAssessment}
                necpalAssessment={necpalAssessment}
                ecogAssessment={ecogAssessment}
              />
            )}

            {/* Clinical note */}
            {encounter.clinicalNote && (
              <EncounterClinicalNote
                note={encounter.clinicalNote}
                collapsible
              />
            )}

            {/* Procedures */}
            <EncounterProcedures procedures={procedures} />

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
