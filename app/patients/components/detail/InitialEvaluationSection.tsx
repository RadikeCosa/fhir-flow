import React from "react";
import { SectionCard } from "./SectionCard";
import { BarthelCard } from "./assessments/BarthelCard";
import { NecpalCard } from "./assessments/NecpalCard";
import { PlanOfCareView } from "./plan-of-care/PlanOfCareView";
import { formatDate } from "../../../../lib/patient/formatters";
import type { PlanOfCare } from "../../../../domain/plan-of-care/plan-of-care";
import type { BarthelAssessment } from "../../../../domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "../../../../domain/assessments/necpal-assessment";

interface InitialEvaluationSectionProps {
  encounterId: string | null;
  encounterDate: string | null;
  planOfCare: PlanOfCare | null;
  barthelAssessment: BarthelAssessment | null;
  necpalAssessment: NecpalAssessment | null;
}

export function InitialEvaluationSection({
  encounterId,
  encounterDate,
  planOfCare,
  barthelAssessment,
  necpalAssessment,
}: InitialEvaluationSectionProps) {
  return (
    <SectionCard title="Evaluación Inicial">
      {encounterId ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Sesión de evaluación
            </span>
            <span className="text-xs text-foreground">
              {encounterDate ? (formatDate(encounterDate) ?? "") : ""}
            </span>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            Evaluaciones basales
          </div>

          {barthelAssessment ? (
            <BarthelCard assessment={barthelAssessment} />
          ) : (
            <p className="text-xs text-muted italic">
              Índice de Barthel no registrado
            </p>
          )}

          {necpalAssessment ? (
            <NecpalCard assessment={necpalAssessment} />
          ) : (
            <p className="text-xs text-muted italic">
              Cribado NECPAL no registrado
            </p>
          )}

          <div className="border-t border-border my-3" />

          {planOfCare ? (
            <PlanOfCareView plan={planOfCare} />
          ) : (
            <p className="text-xs text-muted italic">
              Plan de tratamiento no registrado
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted italic">
          No se registró sesión de evaluación para este episodio
        </p>
      )}
    </SectionCard>
  );
}
