import { FhirClient } from "../../../lib/fhir/fhir-client";
import { PractitionerFhirRepository } from "../repositories/practitioner.fhir-repository";
import type { PractitionerRepository } from "../../../domain/practitioners/practitioner.repository";

export function createPractitionerRepository(
    client?: FhirClient
): PractitionerRepository {
    const c = client ?? new FhirClient();
    return new PractitionerFhirRepository(c);
}
