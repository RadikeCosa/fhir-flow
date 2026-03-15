"use client";

import { BarthelCard } from "../../../components/detail/assessments/BarthelCard";
import { NecpalCard } from "../../../components/detail/assessments/NecpalCard";
import type { BarthelAssessment } from "../../../../../domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "../../../../../domain/assessments/necpal-assessment";

interface Props {
  barthelAssessment: BarthelAssessment | null;
  necpalAssessment: NecpalAssessment | null;
}

/**
 * Renders the assessment cards (Barthel, NECPAL) for a single encounter.
 * Each card occupies one column of a 2-column grid.
 * To add more assessment types in the future, import their card component
 * and add a new <div className="min-w-0"> column inside the grid div.
 */
export default function EncounterAssessmentsSection({
  barthelAssessment,
  necpalAssessment,
}: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
        Evaluaciones
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          {barthelAssessment ? (
            <BarthelCard assessment={barthelAssessment} />
          ) : (
            <p className="text-xs text-muted italic">
              Índice de Barthel no registrado
            </p>
          )}
        </div>
        <div className="min-w-0">
          {necpalAssessment ? (
            <NecpalCard assessment={necpalAssessment} />
          ) : (
            <p className="text-xs text-muted italic">
              Cribado NECPAL no registrado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
