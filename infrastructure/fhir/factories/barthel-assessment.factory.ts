import { FhirClient } from "../../../lib/fhir/fhir-client";
import { BarthelAssessmentFhirRepository } from "../repositories/assessments/barthel-assessment.fhir-repository";
import type { BarthelAssessmentRepository } from "../../../domain/assessments/barthel-assessment.repository";

/**
 * Composition root for the Barthel assessment repository implementation.
 * Allows callers to depend on the domain interface while injecting a custom
 * FhirClient for testing or configuration.
 */
export function createBarthelAssessmentRepository(
    client?: FhirClient
): BarthelAssessmentRepository {
    const c = client ?? new FhirClient();
    return new BarthelAssessmentFhirRepository(c);
}
