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
    label: "Totalmente activo",
    description: "Sin limitaciones funcionales; mantiene actividad habitual.",
  },
  restricted: {
    label: "Restringido",
    description:
      "Limitado para actividades extenuantes, pero conserva actividad ligera.",
  },
  ambulatory: {
    label: "Ambulatorio",
    description:
      "Deambula y realiza autocuidado; incapaz de trabajar de forma activa.",
  },
  "limited-self-care": {
    label: "Autocuidado limitado",
    description:
      "Capaz de autocuidado parcial y permanece en cama/sillon gran parte del dia.",
  },
  disabled: {
    label: "Discapacitado",
    description:
      "Incapaz de autocuidado; dependiente para actividades basicas y en cama/sillon.",
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
      <div className="flex items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          ECOG
        </div>
        <div className="text-sm font-semibold text-foreground">
          {assessment.score}
          <span className="text-xs text-muted"> / 4</span>
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
        <div className="mt-3 space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {assessment.score}
            <span className="text-base font-medium text-muted"> / 4</span>
          </div>
          <div className="text-sm font-medium text-foreground">
            {levelInfo.label}
          </div>
          <div className="text-xs text-muted">{levelInfo.description}</div>
        </div>
      )}
    </div>
  );
}
