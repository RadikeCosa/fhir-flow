import type { Encounter } from "@/domain/encounters/encounter";
import type { BarthelAssessment } from "@/domain/assessments/barthel-assessment";
import type { PlanOfCare } from "@/domain/plan-of-care/plan-of-care";

export interface ReAssessmentEntry {
    encounter: Encounter;
    assessments: BarthelAssessment[];
    planOfCare: PlanOfCare | null;
}
