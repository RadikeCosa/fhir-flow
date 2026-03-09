import React from "react";
import Link from "next/link";
import type { VitalSignRecord } from "../../../../domain/vital-sign-record/vital-sign-record";
import {
  formatDate,
  getVitalSignBadge,
  getBloodPressureBadge,
} from "../../../../lib/patient/formatters";

interface Props {
  record: VitalSignRecord | null;
  patientId?: string;
}

export const VitalSignsSection: React.FC<Props> = ({ record, patientId }) => {
  if (!record) {
    return (
      <section className="p-3 bg-surface border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Signos vitales
          </h2>
          {patientId && record && (
            <Link
              href={`/patients/${patientId}/vital-signs`}
              className="text-xs text-primary hover:underline"
            >
              Ver historial →
            </Link>
          )}
        </div>
        <p className="text-xs text-muted italic">Sin registros</p>
      </section>
    );
  }

  return (
    <section className="p-3 bg-surface border border-border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Signos vitales
        </h2>
        {patientId && record && (
          <Link
            href={`/patients/${patientId}/vital-signs`}
            className="text-xs text-primary hover:underline"
          >
            Ver historial →
          </Link>
        )}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-xs text-muted font-medium">Fecha:</dt>
        <dd className="text-sm text-foreground">
          {formatDate(record.date) ?? ""}
        </dd>

        <dt className="text-xs text-muted font-medium">Registrado por:</dt>
        <dd className="text-sm text-foreground">{record.recordedBy.display}</dd>

        {typeof record.heartRate === "number" &&
          (() => {
            const badge = getVitalSignBadge("heart-rate", record.heartRate);
            return (
              <>
                <dt className="text-xs text-muted font-medium">
                  Frec. cardíaca:
                </dt>
                <dd className="text-sm text-foreground flex items-center gap-2">
                  <span>{record.heartRate} lpm</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                  >
                    {badge.label}
                  </span>
                </dd>
              </>
            );
          })()}

        {typeof record.respiratoryRate === "number" &&
          (() => {
            const badge = getVitalSignBadge(
              "respiratory-rate",
              record.respiratoryRate,
            );
            return (
              <>
                <dt className="text-xs text-muted font-medium">
                  Frec. respiratoria:
                </dt>
                <dd className="text-sm text-foreground flex items-center gap-2">
                  <span>{record.respiratoryRate} rpm</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                  >
                    {badge.label}
                  </span>
                </dd>
              </>
            );
          })()}

        {typeof record.oxygenSaturation === "number" &&
          (() => {
            const badge = getVitalSignBadge(
              "oxygen-saturation",
              record.oxygenSaturation,
            );
            return (
              <>
                <dt className="text-xs text-muted font-medium">SpO2:</dt>
                <dd className="text-sm text-foreground flex items-center gap-2">
                  <span>{record.oxygenSaturation}%</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                  >
                    {badge.label}
                  </span>
                </dd>
              </>
            );
          })()}

        {typeof record.bodyTemperature === "number" &&
          (() => {
            const badge = getVitalSignBadge(
              "body-temperature",
              record.bodyTemperature,
            );
            return (
              <>
                <dt className="text-xs text-muted font-medium">Temperatura:</dt>
                <dd className="text-sm text-foreground flex items-center gap-2">
                  <span>{record.bodyTemperature} °C</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                  >
                    {badge.label}
                  </span>
                </dd>
              </>
            );
          })()}

        {record.bloodPressure &&
          (() => {
            const badge = getBloodPressureBadge(
              record.bloodPressure.systolic,
              record.bloodPressure.diastolic,
            );
            return (
              <>
                <dt className="text-xs text-muted font-medium">
                  Tensión arterial:
                </dt>
                <dd className="text-sm text-foreground flex items-center gap-2">
                  <span>
                    {record.bloodPressure.systolic}/
                    {record.bloodPressure.diastolic} mmHg
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
    </section>
  );
};
