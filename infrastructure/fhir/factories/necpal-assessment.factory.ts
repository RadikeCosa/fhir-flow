import { FhirClient } from "../../../lib/fhir/fhir-client";
import { NecpalAssessmentFhirRepository } from "../repositories/necpal-assessment.fhir-repository";
import type { NecpalAssessmentRepository } from "../../../domain/assessments/necpal-assessment.repository";

/**
 * Composition root for the NECPAL assessment repository implementation.
 * Allows callers to depend on the domain interface while injecting a custom
 * FhirClient for testing or configuration.
 */
export function createNecpalAssessmentRepository(
    client?: FhirClient
): NecpalAssessmentRepository {
    const c = client ?? new FhirClient();
    return new NecpalAssessmentFhirRepository(c);
}
