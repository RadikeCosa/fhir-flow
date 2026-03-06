import React from "react";
import Link from "next/link";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import {
  formatDate,
  getEvaBadge,
  formatEvaScore,
  getEvaTrend,
  type EvaTrend,
} from "../../../../../lib/patient/formatters";

interface Props {
  records: EvaAssessment[];
  patientId?: string;
}

export const EvaAssessmentSection: React.FC<Props> = ({
  records,
  patientId,
}) => {
  const record = records[0] ?? null;
  const trend: EvaTrend = getEvaTrend(records);

  return (
    <section className="p-3 bg-surface border border-border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          EVA — Dolor
        </h2>
        {patientId && (
          <Link
            href={`/patients/${patientId}/assessments`}
            className="text-xs text-primary hover:underline"
          >
            Ver historial →
          </Link>
        )}
      </div>

      {record === null ? (
        <p className="text-xs text-muted italic">Sin registros</p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-xs text-muted font-medium">Fecha:</dt>
          <dd className="text-sm text-foreground">
            {formatDate(record.date) ?? ""}
          </dd>

          <dt className="text-xs text-muted font-medium">Registrado por:</dt>
          <dd className="text-sm text-foreground">
            {record.recordedBy.display}
          </dd>

          <dt className="text-xs text-muted font-medium">Dolor:</dt>
          <dd className="text-sm text-foreground flex items-center gap-2">
            <span>{formatEvaScore(record.score)}</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                getEvaBadge(record.score).colorClass
              }`}
            >
              {getEvaBadge(record.score).label}
            </span>
            {trend === "mejora" && (
              <span className="text-green-600 text-sm">↓ Mejora</span>
            )}
            {trend === "empeora" && (
              <span className="text-red-600 text-sm">↑ Empeora</span>
            )}
            {trend === "estable" && (
              <span className="text-muted text-sm">→ Estable</span>
            )}
          </dd>
        </dl>
      )}
    </section>
  );
};
