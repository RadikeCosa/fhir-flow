import { FhirClient } from "../../lib/fhir/fhir-client";
import { VitalSignRecordFhirRepository } from "./vital-sign-record.fhir-repository";
import type { VitalSignRecordRepository } from "../../domain/vital-sign-record.repository";

/**
 * Factory for a FHIR-backed `VitalSignRecordRepository` implementation.
 *
 * This module wires the infrastructure implementation to the domain
 * interface. An optional `FhirClient` may be passed (useful for tests or
 * custom configuration); a default client is constructed when omitted.
 */
export function createVitalSignRecordRepository(
    client?: FhirClient
): VitalSignRecordRepository {
    const c = client ?? new FhirClient();
    return new VitalSignRecordFhirRepository(c);
}
