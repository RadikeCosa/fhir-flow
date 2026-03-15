"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
        className: "bg-badge-success-bg text-badge-success-text",
      };
    case "mild-dependency":
      return {
        label: "Dep. Leve",
        className: "bg-badge-info-bg text-badge-info-text",
      };
    case "moderate-dependency":
      return {
        label: "Dep. Moderada",
        className: "bg-badge-warning-bg text-badge-warning-text",
      };
    case "severe-dependency":
      return {
        label: "Dep. Severa",
        className: "bg-badge-orange-bg text-badge-orange-text",
      };
    case "total-dependency":
      return {
        label: "Dep. Total",
        className: "bg-badge-error-bg text-badge-error-text",
      };
  }
  // `level` is a discriminated union; this should never be reached.
  const _exhaustiveCheck: never = level;
  void _exhaustiveCheck;
  return {
    label: "Desconocido",
    className: "bg-badge-neutral-bg text-badge-neutral-text",
  };
}

interface BarthelCardProps {
  assessment: BarthelAssessment;
}

export function BarthelCard({ assessment }: BarthelCardProps) {
  const badge = getBarthelLevelBadge(assessment.functionalLevel);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          Índice de Barthel
        </div>
        <div className="text-sm font-semibold text-foreground">
          {assessment.totalScore}
          <span className="text-xs text-muted"> / 100</span>
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
          <div className="text-2xl font-bold text-foreground">
            {assessment.totalScore}
          </div>
          <div className="text-xs text-muted">puntos</div>

          {assessment.items.length > 0 && (
            <div className="mt-2">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {assessment.items.map(
                  (item: {
                    activity: BarthelActivityKey;
                    score: number;
                    maxScore: number;
                  }) => (
                    <Fragment key={item.activity}>
                      <dt className="text-muted">
                        {ACTIVITY_LABELS[item.activity]}
                      </dt>
                      <dd className="text-foreground">
                        {item.score} / {item.maxScore}
                      </dd>
                    </Fragment>
                  ),
                )}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
