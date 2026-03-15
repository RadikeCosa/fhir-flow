"use client";

import { useState } from "react";
import type {
  NecpalAssessment,
  NecpalResult,
} from "../../../../../domain/assessments/necpal-assessment";

interface NecpalCardProps {
  assessment: NecpalAssessment;
}

function getNecpalResultBadge(result: NecpalResult): {
  label: string;
  className: string;
} {
  switch (result) {
    case "positive":
      return { label: "NECPAL +", className: "bg-red-100 text-red-800" };
    case "negative":
      return { label: "NECPAL −", className: "bg-green-100 text-green-800" };
  }
  const _exhaustiveCheck: never = result;
  void _exhaustiveCheck;
  return { label: "NECPAL", className: "bg-gray-100 text-gray-800" };
}

const INDICATOR_LABELS: Record<
  Exclude<keyof NecpalAssessment["indicators"], "surpriseQuestion">,
  string
> = {
  demandIndicator: "Demanda — paciente/familia expresan necesidades",
  needIndicator: "Necesidad — síntomas no controlados o declive funcional",
  diseaseIndicator: "Enfermedad — indicadores específicos por patología",
};

export function NecpalCard({ assessment }: NecpalCardProps) {
  const badge = getNecpalResultBadge(assessment.result);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Cribado de necesidades paliativas
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-3">
        <div className="text-xs text-muted">Pregunta sorpresa</div>
        <div
          className={
            assessment.indicators.surpriseQuestion
              ? "text-foreground"
              : "text-error"
          }
        >
          {assessment.indicators.surpriseQuestion
            ? "Sí me sorprendería"
            : "No me sorprendería"}
        </div>
        <div className="text-xs text-muted italic mt-1">
          Una respuesta negativa activa el cribado NECPAL positivo
        </div>
      </div>

      {assessment.positiveScreen && (
        <div className="mt-4">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Ocultar indicadores ▲" : "Ver indicadores ▼"}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {(
                Object.keys(INDICATOR_LABELS) as Array<
                  keyof typeof INDICATOR_LABELS
                >
              ).map((key) => {
                const present = assessment.indicators[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
                      present ? "border-l-2 border-error" : ""
                    }`}
                  >
                    <span className="text-foreground">
                      {INDICATOR_LABELS[key]}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        present
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {present ? "Presente" : "Ausente"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
