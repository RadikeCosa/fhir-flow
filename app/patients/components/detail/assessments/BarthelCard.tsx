import React from "react";
import type {
  BarthelAssessment,
  BarthelFunctionalLevel,
  BarthelActivityKey,
} from "../../../../../domain/assessments/barthel-assessment";

const ACTIVITY_LABELS: Record<BarthelActivityKey, string> = {
  feeding: "Alimentación",
  bathing: "Baño",
  grooming: "Higiene personal",
  dressing: "Vestido",
  bowel: "Control intestinal",
  bladder: "Control vesical",
  toilet: "Uso del baño",
  transfer: "Transferencias",
  mobility: "Deambulación",
  stairs: "Escaleras",
};

function getBarthelLevelBadge(level: BarthelFunctionalLevel): {
  label: string;
  className: string;
} {
  switch (level) {
    case "independent":
      return {
        label: "Independiente",
        className: "bg-green-100 text-green-800",
      };
    case "mild-dependency":
      return { label: "Dep. Leve", className: "bg-blue-100 text-blue-800" };
    case "moderate-dependency":
      return {
        label: "Dep. Moderada",
        className: "bg-yellow-100 text-yellow-800",
      };
    case "severe-dependency":
      return {
        label: "Dep. Severa",
        className: "bg-orange-100 text-orange-800",
      };
    case "total-dependency":
      return { label: "Dep. Total", className: "bg-red-100 text-red-800" };
  }
  // `level` is a discriminated union; this should never be reached.
  const _exhaustiveCheck: never = level;
  void _exhaustiveCheck;
  return { label: "Desconocido", className: "bg-gray-100 text-gray-800" };
}

interface BarthelCardProps {
  assessment: BarthelAssessment;
}

export function BarthelCard({ assessment }: BarthelCardProps) {
  const badge = getBarthelLevelBadge(assessment.functionalLevel);

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">
            Índice de Barthel
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-foreground">
          {assessment.totalScore} / 100
        </div>
        <div className="text-xs text-muted">puntos</div>
      </div>

      {assessment.items.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-primary cursor-pointer">
            Ver detalle por actividad
          </summary>
          <div className="mt-2">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {assessment.items.map(
                (item: {
                  activity: BarthelActivityKey;
                  score: number;
                  maxScore: number;
                }) => (
                  <React.Fragment key={item.activity}>
                    <dt className="text-muted">
                      {ACTIVITY_LABELS[item.activity]}
                    </dt>
                    <dd className="text-foreground">
                      {item.score} / {item.maxScore}
                    </dd>
                  </React.Fragment>
                ),
              )}
            </dl>
          </div>
        </details>
      )}
    </div>
  );
}
