import React from "react";
import { SectionCard } from "@/app/patients/components/SectionCard";
import { BarthelCard } from "@/app/patients/[id]/components/assessments/BarthelCard";
import { EcogCard } from "@/app/patients/[id]/components/assessments/EcogCard";
import { NecpalCard } from "@/app/patients/[id]/components/assessments/NecpalCard";
import { PlanOfCareView } from "@/app/patients/[id]/components/plan-of-care/PlanOfCareView";
import { formatDate } from "@/lib/patient/formatters";
import type { PlanOfCare } from "@/domain/plan-of-care/plan-of-care";
import type { BarthelAssessment } from "@/domain/assessments/barthel-assessment";
import type { EcogAssessment } from "@/domain/assessments/ecog-assessment";
import type { NecpalAssessment } from "@/domain/assessments/necpal-assessment";

interface InitialEvaluationSectionProps {
  encounterId: string | null;
  encounterDate: string | null;
  planOfCare: PlanOfCare | null;
  barthelAssessment: BarthelAssessment | null;
  necpalAssessment: NecpalAssessment | null;
  ecogAssessment: EcogAssessment | null;
}

export function InitialEvaluationSection({
  encounterId,
  encounterDate,
  planOfCare,
  barthelAssessment,
  necpalAssessment,
  ecogAssessment,
}: InitialEvaluationSectionProps) {
  return (
    <SectionCard title="Evaluación Inicial">
      {encounterId ? (
        <div>
          <div className="text-xs text-muted mb-3">
            {encounterDate ? (formatDate(encounterDate) ?? "") : ""}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2 mb-3">
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
