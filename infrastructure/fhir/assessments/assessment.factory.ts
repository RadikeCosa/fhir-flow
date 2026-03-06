import { EvaAssessmentFhirRepository } from "./eva-assessment.fhir-repository";
import type { AssessmentRepository } from "../../../domain/assessments/assessment.repository";

/**
 * Factory for obtaining an `AssessmentRepository` instance.
 *
 * This is the single entry point used by higher layers to acquire
 * a repository for working with clinical assessments.  When new
 * assessment types are added, the domain interface expands with
 * corresponding methods and the FHIR implementation fills them in.
 * The factory itself does not need to change.
 */
export function createAssessmentRepository(): AssessmentRepository {
    return new EvaAssessmentFhirRepository();
}
