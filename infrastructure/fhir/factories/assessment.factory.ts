import { FhirClient } from "../../../lib/fhir/fhir-client";
import { EvaAssessmentFhirRepository } from "../repositories/assessments/eva-assessment.fhir-repository";
import type { AssessmentRepository } from "../../../domain/assessments/assessment.repository";

/**
 * Factory for obtaining an `AssessmentRepository` instance.
 *
 * This is the single entry point used by higher layers to acquire
 * a repository for working with clinical assessments.  When new
 * assessment types are added, the domain interface expands with
 * corresponding methods and the FHIR implementation fills them in.
 * The factory itself does not need to change.
 *
 * Accepts an optional `FhirClient` to allow injection of a custom client
 * (useful for tests or specialized configuration).
 */
export function createAssessmentRepository(
    client?: FhirClient
): AssessmentRepository {
    const c = client ?? new FhirClient();
    return new EvaAssessmentFhirRepository(c);
}
