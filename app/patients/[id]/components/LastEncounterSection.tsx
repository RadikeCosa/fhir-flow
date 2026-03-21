import React from "react";
import Link from "next/link";
import { SectionCard } from "@/app/patients/components/SectionCard";
import {
  formatDateTime,
  formatPlannedSchedule,
} from "@/lib/patient/formatters";
import {
  formatEncounterDuration,
  getEncounterRepresentativeStart,
} from "@/lib/patient/formatters/encounter.formatters";
import type { Encounter } from "@/domain/encounters/encounter";
import type { Procedure } from "@/domain/procedures/procedure";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import EncounterBadgesRow from "@/app/patients/[id]/encounters/components/EncounterBadgesRow";
import EncounterClinicalNote from "@/app/patients/[id]/encounters/components/EncounterClinicalNote";
import EncounterVitalSignsSection from "@/app/patients/[id]/encounters/components/EncounterVitalSignsSection";
import EncounterEvaSection from "@/app/patients/[id]/encounters/components/EncounterEvaSection";
import EncounterProcedures from "@/app/patients/[id]/encounters/components/EncounterProcedures";

interface Props {
  lastEncounter: Encounter | null;
  nextPlannedEncounter: Encounter | null;
  patientId: string;
  procedures: Procedure[];
  evaRecords: EvaAssessment[];
  vitalSigns: VitalSignRecord[];
}

export const LastEncounterSection: React.FC<Props> = ({
  lastEncounter,
  nextPlannedEncounter,
  patientId,
  procedures,
  evaRecords,
  vitalSigns,
}) => {
  const lastEncounterDisplayStart = lastEncounter
    ? getEncounterRepresentativeStart(lastEncounter)
    : undefined;

  const nextPlannedSchedule = formatPlannedSchedule(
    nextPlannedEncounter?.plannedDate,
    nextPlannedEncounter?.plannedTime,
  );

  // props are accepted for future UI enhancements; currently unused
  // empty state handled below
  if (!lastEncounter && !nextPlannedEncounter) {
    return (
      <SectionCard title="Visitas">
        <p className="text-xs text-muted italic">
          No hay visitas registradas aún
        </p>
        {patientId && (
          <div className="mt-3 pt-3 border-t border-border flex justify-end">
            <Link
              href={`/patients/${patientId}/encounters`}
              className="text-xs text-primary hover:underline"
            >
              Ver historial →
            </Link>
          </div>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Visitas">
      {/* last encounter block */}
      {lastEncounter && (
        <>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            ÚLTIMA VISITA
          </div>
          <div className="flex items-center gap-2 mb-2">
            <EncounterBadgesRow
              status={lastEncounter.status}
              visitType={lastEncounter.visitType}
              showStatusBadge
            />
            <span className="text-sm font-semibold text-foreground ml-auto">
              {formatDateTime(lastEncounterDisplayStart) ?? ""}
            </span>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {lastEncounter.participant && (
              <>
                <dt className="text-xs text-muted font-medium">Profesional:</dt>
                <dd className="text-sm text-foreground">
                  {lastEncounter.participant.practitionerName ||
                    "Profesional asignado"}
                </dd>
              </>
            )}

            {formatEncounterDuration(lastEncounter.durationMinutes) && (
              <>
                <dt className="text-xs text-muted font-medium">Duración:</dt>
                <dd className="text-sm text-foreground">
                  {formatEncounterDuration(lastEncounter.durationMinutes)}
                </dd>
              </>
            )}

            {lastEncounter.reasonDisplay?.trim() && (
              <>
                <dt className="text-xs text-muted font-medium">Motivo:</dt>
                <dd className="text-sm text-foreground">
                  {lastEncounter.reasonDisplay}
                </dd>
              </>
            )}
          </dl>

          {lastEncounter.clinicalNote?.trim() && (
            <EncounterClinicalNote note={lastEncounter.clinicalNote ?? ""} />
          )}

          {evaRecords.length > 0 && (
            <EncounterEvaSection records={evaRecords} summary />
          )}

          {vitalSigns.length > 0 && (
            <EncounterVitalSignsSection records={vitalSigns} />
          )}

          {procedures.length > 0 && (
            <EncounterProcedures procedures={procedures} />
          )}
        </>
      )}

      {/* divider between blocks */}
      {lastEncounter && nextPlannedEncounter && (
        <div className="border-t border-border my-3" />
      )}

      {/* next planned encounter block */}
      {nextPlannedEncounter && (
        <>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            PRÓXIMA VISITA
          </div>
          <div className="flex items-center gap-2 mb-2">
            <EncounterBadgesRow
              status={nextPlannedEncounter.status}
              visitType={nextPlannedEncounter.visitType}
              showStatusBadge
            />
            <span className="text-sm font-semibold text-foreground ml-auto">
              {nextPlannedSchedule.plannedDateLabel ?? "Sin fecha planificada"}
            </span>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <>
              <dt className="text-xs text-muted font-medium">Horario:</dt>
              <dd className="text-sm text-foreground">
                {nextPlannedSchedule.plannedTimeLabel ?? "Sin horario definido"}
              </dd>
            </>

            {nextPlannedEncounter.participant && (
              <>
                <dt className="text-xs text-muted font-medium">Profesional:</dt>
                <dd className="text-sm text-foreground">
                  {nextPlannedEncounter.participant.practitionerName ||
                    "Profesional asignado"}
                </dd>
              </>
            )}

            {formatEncounterDuration(nextPlannedEncounter.durationMinutes) && (
              <>
                <dt className="text-xs text-muted font-medium">Duración:</dt>
                <dd className="text-sm text-foreground">
                  {formatEncounterDuration(
                    nextPlannedEncounter.durationMinutes,
                  )}
                </dd>
              </>
            )}

            {nextPlannedEncounter.reasonDisplay?.trim() && (
              <>
                <dt className="text-xs text-muted font-medium">Motivo:</dt>
                <dd className="text-sm text-foreground">
                  {nextPlannedEncounter.reasonDisplay}
                </dd>
              </>
            )}
          </dl>
        </>
      )}

      {/* footer link */}
      <div className="border-t border-border mt-3 pt-3 flex justify-end">
        <Link
          href={`/patients/${patientId}/encounters`}
          className="text-xs text-primary hover:underline"
        >
          Ver historial →
        </Link>
      </div>
    </SectionCard>
  );
};
