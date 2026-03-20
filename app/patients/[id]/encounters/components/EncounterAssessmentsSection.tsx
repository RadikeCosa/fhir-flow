"use client";

import { BarthelCard } from "../../components/assessments/BarthelCard";
import { EcogCard } from "../../components/assessments/EcogCard";
import { NecpalCard } from "../../components/assessments/NecpalCard";
import type { BarthelAssessment } from "../../../../../domain/assessments/barthel-assessment";
import type { EcogAssessment } from "../../../../../domain/assessments/ecog-assessment";
import type { NecpalAssessment } from "../../../../../domain/assessments/necpal-assessment";

interface Props {
  barthelAssessment: BarthelAssessment | null;
  necpalAssessment: NecpalAssessment | null;
  ecogAssessment: EcogAssessment | null;
}

/**
 * Renders the assessment cards (Barthel, NECPAL, ECOG) for a single encounter.
 * Cards are arranged in a 2-column grid and wrap naturally as needed.
 * To add more assessment types in the future, import their card component
 * and add a new <div className="min-w-0"> column inside the grid div.
 */
export default function EncounterAssessmentsSection({
  barthelAssessment,
  necpalAssessment,
  ecogAssessment,
}: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
        Evaluaciones
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="min-w-0">
          {ecogAssessment ? (
            <EcogCard assessment={ecogAssessment} />
          ) : (
            <p className="text-xs text-muted italic">ECOG no registrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
