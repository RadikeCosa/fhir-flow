import type { Encounter } from "@/domain/encounters/encounter";
import type { BarthelAssessment } from "@/domain/assessments/barthel-assessment";
import type { PlanOfCare } from "@/domain/plan-of-care/plan-of-care";
import { formatDate } from "@/lib/patient/formatters";
import { getEncounterRepresentativeStart } from "@/lib/patient/formatters/encounter.formatters";
import { PlanOfCareView } from "@/app/patients/[id]/components/plan-of-care/PlanOfCareView";
import ReAssessmentBarthelBlock from "@/app/patients/[id]/components/re-assessments/ReAssessmentBarthelBlock";

interface ReAssessmentCardProps {
  encounter: Encounter;
  assessments: BarthelAssessment[];
  initialAssessments: BarthelAssessment[];
  planOfCare: PlanOfCare | null;
}

export default function ReAssessmentCard({
  encounter,
  assessments,
  initialAssessments,
  planOfCare,
}: ReAssessmentCardProps) {
  const hasAssessments = assessments.length > 0;

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Re-evaluación
          </span>
          <span className="text-sm font-semibold text-foreground">
            {formatDate(getEncounterRepresentativeStart(encounter)) ?? ""}
          </span>
        </div>
        {encounter.participant && (
          <span className="text-xs text-muted">
            {encounter.participant.practitionerName}
          </span>
        )}
      </div>

      {hasAssessments ? (
        assessments.map((assessment) => {
          if (assessment.type === "barthel") {
            const initialBarthel = initialAssessments.find(
              (a) => a.type === "barthel",
            );
            return (
              <ReAssessmentBarthelBlock
                key={assessment.id}
                assessment={assessment}
                initialAssessment={initialBarthel ?? null}
              />
            );
          }
          return null;
        })
      ) : (
        <p className="text-xs text-muted italic">
          Sin evaluaciones registradas
        </p>
      )}

      {planOfCare && (
        <>
          <div className="border-t border-border" />
          <PlanOfCareView plan={planOfCare} />
        </>
      )}
    </div>
  );
}
