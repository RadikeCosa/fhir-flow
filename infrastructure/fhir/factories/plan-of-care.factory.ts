import { FhirClient } from "../../../lib/fhir/fhir-client";
import { PlanOfCareFhirRepository } from "../repositories/plan-of-care.fhir-repository";
import type { PlanOfCareRepository } from "../../../domain/plan-of-care/plan-of-care.repository";

/**
 * Composition root for the Plan of Care repository implementation.
 * Allows callers to depend on the domain interface while injecting a custom
 * FhirClient for testing or configuration.
 */
export function createPlanOfCareRepository(
    client?: FhirClient
): PlanOfCareRepository {
    const c = client ?? new FhirClient();
    return new PlanOfCareFhirRepository(c);
}
