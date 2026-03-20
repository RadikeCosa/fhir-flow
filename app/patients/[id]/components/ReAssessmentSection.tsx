import type { Encounter } from "@/domain/encounters/encounter";
import type { BarthelAssessment } from "@/domain/assessments/barthel-assessment";
import type { PlanOfCare } from "@/domain/plan-of-care/plan-of-care";
import { SectionCard } from "@/app/patients/components/SectionCard";
import ReAssessmentCard from "@/app/patients/[id]/components/re-assessments/ReAssessmentCard";

export interface ReAssessmentEntry {
  encounter: Encounter;
  assessments: BarthelAssessment[];
  planOfCare: PlanOfCare | null;
}

interface ReAssessmentSectionProps {
  entries: ReAssessmentEntry[];
  initialAssessments: BarthelAssessment[];
}

export default function ReAssessmentSection({
  entries,
  initialAssessments,
}: ReAssessmentSectionProps) {
  return (
    <SectionCard title="Re-evaluaciones">
      {entries.length === 0 ? (
        <p className="text-xs text-muted italic">
          No hay re-evaluaciones registradas en este episodio
        </p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <ReAssessmentCard
              key={entry.encounter.id}
              encounter={entry.encounter}
              assessments={entry.assessments}
              initialAssessments={initialAssessments}
              planOfCare={entry.planOfCare}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
