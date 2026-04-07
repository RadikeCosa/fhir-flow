import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionCard } from "../../../components/SectionCard";
import {
  formatDateTime,
  formatPlannedSchedule,
} from "../../../../../lib/patient/formatters";
import {
  getEncounterHistorySummary,
  formatEncounterVisitType,
  getEncounterRepresentativeStart,
} from "../../../../../lib/patient/formatters/encounter.formatters";
import type { Encounter } from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import EncounterBadgesRow from "./EncounterBadgesRow";

interface Props {
  encounter: Encounter;
  procedures: Procedure[];
  vitalSigns: VitalSignRecord[];
  evaRecords: EvaAssessment[];
}

export default function EncounterCard({
  encounter,
  procedures,
  vitalSigns,
  evaRecords,
}: Props) {
  const isPlanned = encounter.status === "planned";
  const summary = getEncounterHistorySummary(
    encounter,
    vitalSigns,
    evaRecords,
    procedures,
  );

  const plannedSchedule = formatPlannedSchedule(
    encounter.plannedDate,
    encounter.plannedTime,
  );
  const representativeStart = getEncounterRepresentativeStart(encounter);

  const formattedDate = isPlanned
    ? `${plannedSchedule.plannedDateLabel ?? "Sin fecha planificada"} • ${plannedSchedule.plannedTimeLabel ?? "Sin horario definido"}`
    : (formatDateTime(representativeStart) ?? representativeStart ?? "");
  const temporalSummaryLabel = isPlanned ? "Programada" : "Inicio real";
  const visitLabel = formatEncounterVisitType(encounter.visitType);
  const detailHref = `/patients/${encounter.patientId}/encounters/${encounter.id}`;
  const summaryPreview = summary.preview ?? encounter.reasonDisplay?.trim();

  const presenceIndicators = [
    summary.hasVitalSigns ? "Vitales" : null,
    summary.hasEvaRecords ? "EVA" : null,
    summary.hasProcedures ? "Procedimientos" : null,
  ].filter((value): value is string => value !== null);

  return (
    <div className={isPlanned ? "border-l-4 border-blue-400" : ""}>
      <SectionCard title={visitLabel}>
        <Link
          href={detailHref}
          className="group block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <EncounterBadgesRow
                    status={encounter.status}
                    visitType={encounter.visitType}
                  />
                  <span className="text-xs text-muted">
                    {temporalSummaryLabel}: {formattedDate}
                  </span>
                </div>

                <p className="text-sm text-foreground">
                  {summaryPreview || "Sin motivo registrado"}
                </p>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                Abrir detalle
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {presenceIndicators.length > 0 ? (
                presenceIndicators.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted">
                  Sin indicadores clínicos visibles
                </span>
              )}
            </div>
          </div>
        </Link>

        {isPlanned && (
          <p className="mt-3 text-xs text-muted italic">
            Sin contexto clínico adicional por tratarse de una visita
            planificada.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
