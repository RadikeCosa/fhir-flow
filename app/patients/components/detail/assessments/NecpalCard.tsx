"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
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
      return {
        label: "NECPAL +",
        className: "bg-surface text-error border border-error",
      };
    case "negative":
      return {
        label: "NECPAL −",
        className: "bg-surface text-success border border-success",
      };
  }
  const _exhaustiveCheck: never = result;
  void _exhaustiveCheck;
  return {
    label: "NECPAL",
    className: "bg-surface text-muted border border-border",
  };
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
      <div className="flex items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          Cribado NECPAL
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Ocultar detalle" : "Ver detalle"}
          >
            {expanded ? (
              <>
                Ocultar
                <ChevronUp size={14} aria-hidden="true" />
              </>
            ) : (
              <>
                Ver
                <ChevronDown size={14} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      {expanded && (
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

          {assessment.positiveScreen && (
            <div className="mt-3 space-y-2">
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
                          ? "bg-surface text-success border border-success"
                          : "bg-surface text-muted border border-border"
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
