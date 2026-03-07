import { FhirClient } from "../../../lib/fhir/fhir-client";
import { EncounterFhirRepository } from "../repositories/encounter.fhir-repository";
import type { EncounterRepository } from "../../domain/encounter.repository";

/**
 * Factory that produces a FHIR-backed EncounterRepository instance.
 *
 * The repository is wired here so that callers depend solely on the
 * `EncounterRepository` interface. An optional `FhirClient` may be provided
 * (useful for testing); when omitted a default client is constructed.
 */
export function createEncounterRepository(client?: FhirClient): EncounterRepository {
    const c = client ?? new FhirClient();
    return new EncounterFhirRepository(c);
}
