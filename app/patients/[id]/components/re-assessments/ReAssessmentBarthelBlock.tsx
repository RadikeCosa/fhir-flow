import type { BarthelAssessment } from "@/domain/assessments/barthel-assessment";
import { BarthelCard } from "@/app/patients/[id]/components/assessments/BarthelCard";
import BarthelDeltaDisplay from "@/app/patients/[id]/components/re-assessments/BarthelDeltaDisplay";

interface ReAssessmentBarthelBlockProps {
  assessment: BarthelAssessment;
  initialAssessment: BarthelAssessment | null;
}

export default function ReAssessmentBarthelBlock({
  assessment,
  initialAssessment,
}: ReAssessmentBarthelBlockProps) {
  return (
    <div className="space-y-1">
      <BarthelCard assessment={assessment} />
      {initialAssessment && (
        <BarthelDeltaDisplay
          currentScore={assessment.totalScore}
          initialScore={initialAssessment.totalScore}
        />
      )}
    </div>
  );
}
