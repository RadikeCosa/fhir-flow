import { FhirClient } from "../../../lib/fhir/fhir-client";
import { EcogAssessmentFhirRepository } from "../repositories/assessments/ecog-assessment.fhir-repository";
import type { EcogAssessmentRepository } from "../../../domain/assessments/ecog-assessment.repository";

/**
 * Composition root for the ECOG assessment repository implementation.
 * Allows callers to depend on the domain interface while injecting a custom
 * FhirClient for testing or configuration.
 */
export function createEcogAssessmentRepository(
    client?: FhirClient
): EcogAssessmentRepository {
    const c = client ?? new FhirClient();
    return new EcogAssessmentFhirRepository(c);
}
