import type { BarthelAssessment } from "../../../../domain/assessments/barthel-assessment";
import { BarthelCard } from "../assessments/BarthelCard";
import BarthelDeltaDisplay from "./BarthelDeltaDisplay";

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
