import React from "react";
import Link from "next/link";
import { SectionCard } from "./SectionCard";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatDate } from "../../../../lib/patient/formatters";
import {
  formatEncounterVisitType,
  getEncounterStatusBadge,
  formatEncounterDuration,
} from "../../../../lib/patient/formatters/encounter.formatters";
import {
  groupProceduresByCategory,
  formatProcedureCategory,
} from "../../../../lib/patient/formatters/procedure.formatters";
import {
  getEvaBadge,
  formatEvaScore,
  getLatestEva,
  getEvaTrend,
} from "../../../../lib/patient/formatters/assessments/eva-assessment.formatters";
import {
  getVitalSignBadge,
  getBloodPressureBadge,
} from "../../../../lib/patient/formatters";
import type { Encounter } from "../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../domain/procedures/procedure";
import type { EvaAssessment } from "../../../../domain/assessments/eva-assessment";
import type { VitalSignRecord } from "../../../../domain/vital-sign-record/vital-sign-record";

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
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                getEncounterStatusBadge(lastEncounter.status).colorClass
              }`}
            >
              {getEncounterStatusBadge(lastEncounter.status).label}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatEncounterVisitType(lastEncounter.visitType)}
            </span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-xs text-muted font-medium">Fecha:</dt>
            <dd className="text-sm text-foreground">
              {formatDate(lastEncounter.periodStart) ?? ""}
            </dd>

            {formatEncounterDuration(lastEncounter.durationMinutes) && (
              <>
                <dt className="text-xs text-muted font-medium">Duración:</dt>
                <dd className="text-sm text-foreground">
                  {formatEncounterDuration(lastEncounter.durationMinutes)}
                </dd>
              </>
            )}

            {lastEncounter.participant && (
              <>
                <dt className="text-xs text-muted font-medium">Profesional:</dt>
                <dd className="text-sm text-foreground">
                  {lastEncounter.participant.practitionerName}
                  {lastEncounter.participant.role &&
                    ` (${lastEncounter.participant.role})`}
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
            <div className="mt-4">
              <div className="text-xs font-semibold text-muted uppercase tracking-wide">
                Nota clínica
              </div>
              <div className="mt-1 bg-surface border border-border rounded-md p-3 text-sm text-foreground">
                {lastEncounter.clinicalNote}
              </div>
            </div>
          )}

          {vitalSigns.length > 0 && (
            <>
              <div className="text-xs font-semibold text-muted uppercase tracking-wide mt-3 mb-1">
                Signos vitales
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {typeof vitalSigns[0].heartRate === "number" &&
                  (() => {
                    const badge = getVitalSignBadge(
                      "heart-rate",
                      vitalSigns[0].heartRate,
                    );
                    return (
                      <>
                        <dt className="text-xs text-muted font-medium">
                          Frec. cardíaca:
                        </dt>
                        <dd className="text-sm text-foreground flex items-center gap-2">
                          <span>{vitalSigns[0].heartRate} lpm</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                          >
                            {badge.label}
                          </span>
                        </dd>
                      </>
                    );
                  })()}

                {typeof vitalSigns[0].respiratoryRate === "number" &&
                  (() => {
                    const badge = getVitalSignBadge(
                      "respiratory-rate",
                      vitalSigns[0].respiratoryRate,
                    );
                    return (
                      <>
                        <dt className="text-xs text-muted font-medium">
                          Frec. respiratoria:
                        </dt>
                        <dd className="text-sm text-foreground flex items-center gap-2">
                          <span>{vitalSigns[0].respiratoryRate} rpm</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                          >
                            {badge.label}
                          </span>
                        </dd>
                      </>
                    );
                  })()}

                {typeof vitalSigns[0].oxygenSaturation === "number" &&
                  (() => {
                    const badge = getVitalSignBadge(
                      "oxygen-saturation",
                      vitalSigns[0].oxygenSaturation,
                    );
                    return (
                      <>
                        <dt className="text-xs text-muted font-medium">
                          SpO2:
                        </dt>
                        <dd className="text-sm text-foreground flex items-center gap-2">
                          <span>{vitalSigns[0].oxygenSaturation}%</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                          >
                            {badge.label}
                          </span>
                        </dd>
                      </>
                    );
                  })()}

                {typeof vitalSigns[0].bodyTemperature === "number" &&
                  (() => {
                    const badge = getVitalSignBadge(
                      "body-temperature",
                      vitalSigns[0].bodyTemperature,
                    );
                    return (
                      <>
                        <dt className="text-xs text-muted font-medium">
                          Temperatura:
                        </dt>
                        <dd className="text-sm text-foreground flex items-center gap-2">
                          <span>{vitalSigns[0].bodyTemperature} °C</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                          >
                            {badge.label}
                          </span>
                        </dd>
                      </>
                    );
                  })()}

                {vitalSigns[0].bloodPressure &&
                  (() => {
                    const badge = getBloodPressureBadge(
                      vitalSigns[0].bloodPressure.systolic,
                      vitalSigns[0].bloodPressure.diastolic,
                    );
                    return (
                      <>
                        <dt className="text-xs text-muted font-medium">
                          Tensión arterial:
                        </dt>
                        <dd className="text-sm text-foreground flex items-center gap-2">
                          <span>
                            {vitalSigns[0].bloodPressure.systolic}/
                            {vitalSigns[0].bloodPressure.diastolic} mmHg
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                          >
                            {badge.label}
                          </span>
                        </dd>
                      </>
                    );
                  })()}
              </dl>
            </>
          )}

          {procedures.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mt-3 mb-1">
                Procedimientos
              </h3>
              {[...groupProceduresByCategory(procedures).entries()].map(
                ([category, procs]) => (
                  <div key={category}>
                    <p className="text-xs text-muted font-medium">
                      {formatProcedureCategory(category)}
                    </p>
                    <ul className="list-none pl-4 text-sm text-foreground">
                      {procs.map((p) => (
                        <li key={p.id}>· {p.display}</li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </>
          )}

          {lastEncounter.clinicalNote && (
            <div className="mt-2">
              <p className="text-xs text-muted font-medium">Nota clínica:</p>
              <p className="text-sm text-foreground italic">
                {lastEncounter.clinicalNote}
              </p>
            </div>
          )}

          {evaRecords.length > 0 && (
            <>
              <div className="text-xs font-semibold text-muted uppercase tracking-wide mt-3 mb-1">
                Dolor (EVA)
              </div>
              {(() => {
                const latest = getLatestEva(evaRecords);
                if (!latest) return null;
                const badge = getEvaBadge(latest.score);
                const trend = getEvaTrend(evaRecords);
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      {formatEvaScore(latest.score)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                    >
                      {badge.label}
                    </span>
                    {trend !== "sin-datos" && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        {trend === "mejora" && (
                          <>
                            <TrendingDown size={14} className="text-success" />
                            mejora
                          </>
                        )}
                        {trend === "empeora" && (
                          <>
                            <TrendingUp size={14} className="text-error" />
                            empeora
                          </>
                        )}
                        {trend === "estable" && (
                          <>
                            <Minus size={14} className="text-muted" />
                            estable
                          </>
                        )}
                      </span>
                    )}
                  </div>
                );
              })()}
            </>
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
            Próxima visita
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-1">
            <dt className="text-xs text-muted font-medium">Fecha:</dt>
            <dd className="text-sm text-foreground">
              {formatDate(nextPlannedEncounter.periodStart) ?? ""}
            </dd>
            <dt className="text-xs text-muted font-medium">Tipo:</dt>
            <dd className="text-sm text-foreground">
              {formatEncounterVisitType(nextPlannedEncounter.visitType)}
            </dd>
            {nextPlannedEncounter.participant && (
              <>
                <dt className="text-xs text-muted font-medium">Profesional:</dt>
                <dd className="text-sm text-foreground">
                  {nextPlannedEncounter.participant.practitionerName}
                </dd>
              </>
            )}
          </dl>
        </>
      )}

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
};
