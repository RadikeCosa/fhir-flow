"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type {
  EcogAssessment,
  EcogPerformanceLevel,
} from "../../../../../domain/assessments/ecog-assessment";

interface EcogCardProps {
  assessment: EcogAssessment;
}

const PERFORMANCE_LEVEL_LABELS: Record<
  EcogPerformanceLevel,
  { label: string; description: string }
> = {
  "fully-active": {
    label: "Actividad normal",
    description:
      "Totalmente activo, sin restricciones en actividades habituales.",
  },
  restricted: {
    label: "Síntomas leves",
    description:
      "Puede realizar actividades livianas pero tiene alguna limitación para esfuerzos intensos.",
  },
  ambulatory: {
    label: "Ambulatorio, no puede trabajar",
    description:
      "Puede levantarse y cuidarse solo, pero no puede realizar trabajo activo.",
  },
  "limited-self-care": {
    label: "Limitado, pasa mucho tiempo en cama",
    description:
      "Solo puede cuidarse parcialmente. Permanece en cama más del 50% del día.",
  },
  disabled: {
    label: "Totalmente dependiente",
    description: "Incapaz de cuidarse. Permanece completamente en cama.",
  },
};

function getEcogLevelBadge(level: EcogPerformanceLevel): {
  label: string;
  className: string;
} {
  switch (level) {
    case "fully-active":
      return {
        label: PERFORMANCE_LEVEL_LABELS[level].label,
        className: "bg-green-100 text-green-800",
      };
    case "restricted":
      return {
        label: PERFORMANCE_LEVEL_LABELS[level].label,
        className: "bg-blue-100 text-blue-800",
      };
    case "ambulatory":
      return {
        label: PERFORMANCE_LEVEL_LABELS[level].label,
        className: "bg-yellow-100 text-yellow-800",
      };
    case "limited-self-care":
      return {
        label: PERFORMANCE_LEVEL_LABELS[level].label,
        className: "bg-orange-100 text-orange-800",
      };
    case "disabled":
      return {
        label: PERFORMANCE_LEVEL_LABELS[level].label,
        className: "bg-red-100 text-red-800",
      };
  }
  const _exhaustiveCheck: never = level;
  void _exhaustiveCheck;
  return {
    label: "Desconocido",
    className: "bg-surface text-muted border border-border",
  };
}

export function EcogCard({ assessment }: EcogCardProps) {
  const [expanded, setExpanded] = useState(false);
  const badge = getEcogLevelBadge(assessment.performanceLevel);
  const levelInfo = PERFORMANCE_LEVEL_LABELS[assessment.performanceLevel];

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          ECOG
        </div>
        <div className="text-sm font-semibold text-foreground">
          {assessment.score}
        </div>
        <div className="flex flex-1 justify-end items-center gap-2">
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
        <div className="mt-3 space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {assessment.score}
            <span className="text-base font-medium text-muted"> / 4</span>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          <div className="text-xs text-muted">{levelInfo.description}</div>
        </div>
      )}
    </div>
  );
}
