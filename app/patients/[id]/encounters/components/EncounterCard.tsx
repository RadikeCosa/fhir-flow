"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SectionCard } from "../../../components/SectionCard";
import {
  formatDateTime,
  formatPlannedSchedule,
} from "../../../../../lib/patient/formatters";
import {
  formatEncounterDuration,
  getEncounterHistorySummary,
  formatEncounterVisitType,
  getEncounterRepresentativeEnd,
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
  const [expanded, setExpanded] = useState(false);

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
  const representativeEnd = getEncounterRepresentativeEnd(encounter);

  const formattedDate = isPlanned
    ? `${plannedSchedule.plannedDateLabel ?? "Sin fecha planificada"} • ${plannedSchedule.plannedTimeLabel ?? "Sin horario definido"}`
    : (formatDateTime(representativeStart) ?? representativeStart ?? "");
  const visitLabel = formatEncounterVisitType(encounter.visitType);
  const detailHref = `/patients/${encounter.patientId}/encounters/${encounter.id}`;
  const summaryPreview = summary.preview ?? encounter.reasonDisplay?.trim();

  const hasDetails =
    !isPlanned &&
    (!!encounter.reasonDisplay?.trim() ||
      !!encounter.participant ||
      typeof encounter.durationMinutes === "number" ||
      !!representativeEnd);

  const presenceIndicators = [
    summary.hasVitalSigns ? "Vitales" : null,
    summary.hasEvaRecords ? "EVA" : null,
    summary.hasProcedures ? "Procedimientos" : null,
  ].filter((value): value is string => value !== null);

  return (
    <div className={isPlanned ? "border-l-4 border-blue-400" : ""}>
      <SectionCard title={visitLabel}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <EncounterBadgesRow
                  status={encounter.status}
                  visitType={encounter.visitType}
                />
                <span className="text-xs text-muted">{formattedDate}</span>
              </div>

              <p className="text-sm text-foreground">
                {summaryPreview || "Sin motivo registrado"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href={detailHref}
                className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
              >
                Abrir detalle
              </Link>

              {hasDetails && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? (
                    <>
                      Ocultar contexto
                      <ChevronUp size={14} aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Ver contexto
                      <ChevronDown size={14} aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
            </div>
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

        {isPlanned && (
          <p className="mt-3 text-xs text-muted italic">
            Sin contexto clínico adicional por tratarse de una visita
            planificada.
          </p>
        )}

        {expanded && (
          <div className="space-y-3 pt-3 border-t border-border">
            {encounter.reasonDisplay?.trim() && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Motivo / contexto
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {encounter.reasonDisplay}
                </p>
              </div>
            )}

            <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Estado
                </dt>
                <dd className="text-foreground">
                  <EncounterBadgesRow
                    status={encounter.status}
                    visitType={encounter.visitType}
                  />
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Inicio
                </dt>
                <dd className="text-muted">
                  {formatDateTime(representativeStart) ?? representativeStart}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Fin
                </dt>
                <dd className="text-muted">
                  {representativeEnd
                    ? (formatDateTime(representativeEnd) ?? representativeEnd)
                    : "Sin registrar"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Duración
                </dt>
                <dd className="text-muted">
                  {formatEncounterDuration(encounter.durationMinutes) ??
                    "Sin registrar"}
                </dd>
              </div>

              <div className="md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Profesional
                </dt>
                <dd className="text-muted">
                  {encounter.participant?.practitionerName ??
                    "Profesional asignado"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
